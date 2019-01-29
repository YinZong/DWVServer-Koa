const koa = require('koa');
const koaRouter = require('koa-router');
const path = require('path');
const serve = require('koa-static');
const send = require('koa-send');
const app = new koa();
const route = new koaRouter();

const multer = require('koa-multer');
const bodyParser = require('koa-bodyparser');
const fs = require('fs');
const cors = require('koa2-cors');
const morgan = require('koa-morgan');

const tools = require('./Function/tools.js');
const pacs = require('./Function/connect_pacs.js');
const folder = require('./Function/folder_manger.js');
const buildcm = require('./Function/build_dcm.js');

app.use(cors());
app.use(morgan('dev'));

app.use(serve(__dirname, './css'));
app.use(serve(__dirname, './retrieve'));
app.use(bodyParser({'jsonLimit' : '50mb'}));  //to support JSON-encoded bodies
app.use(route.routes());

// app.use(express.urlencoded({limit: '50mb', extended: true}));   //to support URL-encoded bodies

//**** index page
route.get("/", ctx => {
	ctx.response.type = "html";
	ctx.response.body = fs.createReadStream(__dirname + '/html/index.html');
	tools.resetDir();
});

//* FUNCTION 1 : Impelement jpg convert to dcm format file */
//設定存取jpg圖片的資料夾
var jpgStorage = multer.diskStorage({
	destination : (ctx, file, cb) => {
		cb(null, './Images');
	},
	filename : (ctx, file, cb) => {
		cb(null, file.originalname);
	}
});

var jpg_upload = multer({ storage: jpgStorage });

route.post("/jpg-upload", jpg_upload.single('jpgUploader'), async ctx => {
	try{
		if(ctx.req.file){
			console.log('Api_1 : jpg upload api success!');
			FILENAME = ctx.req.file.originalname;
			console.log(FILENAME);
			ctx.response.type = "html";
			ctx.response.body =  fs.createReadStream(__dirname + '/html/jpg-upload.html');
			return FILENAME; 
		}else{
			throw Error('Fail');
			ctx.body = 'Api_1 Server Error';
		}
	}catch(e){
		console.log('===');
		console.log(e);
	}
});

route.get("/jpg-upload", ctx => {
	try{
		if(ctx.request.query){
			var today = new Date();
			var DATE = today.getFullYear() + "/" + (today.getMonth()+1) + "/" + today.getDate();
			var TIME = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
			// console.log(ctx.request.query);
			tools.xmlCreater(ctx.request.query, DATE, TIME);
			ctx.response.type = "html";
			ctx.response.body = fs.createReadStream(__dirname + '/html/download.html');
			return FILENAME;	
		}else{
			throw Error('Fail');
			ctx.body = 'Server Error';
		}
	}catch(e){
		console.log(e);
	}

});

route.get("/download", async (ctx) => {
	console.log(FILENAME);
	var DName = ctx.request.query.dcmName;
	if(DName == ""){
		var FileName = 'Custom_jpg2dcm.dcm';
	}
	else{
		var FileName = DName;
	}
	ctx.attachment(decodeURI('/dcmFiles/' + FileName));
	await send(ctx, '/dcmFiles/3456.dcm');
});

//* FUNCTION 2 : Impelement dcm file convert to Image file */
//設定存取dcm檔案的資料夾
var dcmStorage = multer.diskStorage({
	destination : (ctx, file, cb) => {
		cb(null, './dcmFiles');
	},
	filename : (ctx, file, cb) => {
		cb(null, file.originalname);
	}
});

var dcm_upload = multer({storage: dcmStorage});

route.post("/dcm-download", dcm_upload.single('DcmUploader'), async ctx => {
	try{
		if(ctx.req.file){
			console.log('Api_2 : DCM upload api success!');
			tools.dcm2img();
			ctx.response.type = "html";
			ctx.response.body = fs.createReadStream(__dirname + '/html/dcm-upload.html');
		}
		else{
			throw Error('Fail');
			ctx.body = 'Api_2 Server Error';
		}
	}catch(e){
		console.log(e);
	}

});

route.get("/jpg-download", async ctx => {
	try{
		var jpg_Name = ctx.query.jpgName;
		if(jpg_Name == ""){
			var FileName = 'Custom_Image.jpg';
		}
		else{
			var FileName = jpg_Name;
		}
		ctx.attachment(decodeURI('/Images/' + FileName));
		await send(ctx, '/Images/img.jpg');
	}catch(e){
		console.log(e);
	}
});

//* FUNCTION 3 : Retrieve Objects from PACS server. */
//輸入pacs 相關訊息取得dicom檔案
route.post("/Connect-Server/retrieve", async (ctx) => {
	try{
		var path_number = 0;
		var FOLDER_NAME = await folder.folder_manger(path_number);
		var a = await pacs.getScu(ctx.request.body, FOLDER_NAME);
		console.log('Api_3 : Retrieve Objects from PACS server.');
		ctx.response.type = "json";
		ctx.body = JSON.parse(a);
	}catch(e){
		console.log(e);
	}
});

//* FUNCTION 4 : RESTful api => Retrieve objects from PACS server. */
//接收表單進行getscu 並回傳檔案url
route.post("/PACS/retrieve", async (ctx) => {
	try{
		var path_number = 0;
		var FOLDER_NAME = await folder.folder_manger(path_number);
		var dcm_url = await pacs.geturl(ctx.request.body, FOLDER_NAME);
		console.log('Api_4 : Retrieve Objects from PACS server.');
		ctx.response.type = 'json';
		ctx.body = JSON.parse(dcm_url);
	}catch(e){
		console.log(e);
	}
});


//* FUNCTION 5 : Receive jpg file and json format message to convert into DICOM file. */
//接收圖片同時解析json內容轉換成dicom檔案
var ImageStorage = multer.diskStorage({
	destination: (ctx, file, cb) => {
		cb(null, "./Images");
	},
	filename: (ctx, file, cb) => {
		cb(null, file.originalname);
	}
});

var img_upload = multer({storage: ImageStorage});
route.post("/PACS/dcm-upload-with-annotation/", img_upload.single('ImgUploader'), async (ctx) => {
	try{
		var fmode = 0;
		await tools.cleanFolder(ctx.req.file.originalname, fmode);
		if(ctx.req.file){
			const path_number = 1;
			var FOLDER_NAME = await folder.folder_manger(path_number);
			await buildcm.parse_json2xml(ctx.req.body.tagJson);
			FILENAME = ctx.req.file.originalname;
			await tools.jpg2dcm(ctx.req.body, FILENAME, FOLDER_NAME);
			console.log('Api_5 : Receive jpg file and json format message to convert into DICOM file.');
			console.log('OK! 204');
			ctx.response.status = 204;
			ctx.body = 'Check it out';
		}
		else{
			throw Error('Fail');
			ctx.response.status = 500;
			ctx.body = 'Api_5 Server Error';
		}

	}catch(e){
		console.log(e);
	}
});

//* FUNCTION 6 : Store the dcm file to PACS server after receive DICOM file. */
//接收dicom檔案並儲存至pacs server
var dicomStorage = multer.diskStorage({
	destination : (ctx, file, cb) => {
		cb(null, './dcmCache');
	},
	filename : (ctx, file, cb) => {
		cb(null, file.originalname);
	}
});

var dicom_upload = multer({storage: dicomStorage});
route.post("/PACS/dcm-upload/", dicom_upload.single('DicomUploader'), async (ctx) => {
	try{
		var fmode = 1;
		await tools.cleanFolder(ctx.req.file.originalname, fmode);
		if(ctx.req.file){
			FILENAME = ctx.req.file.originalname;
			console.log(FILENAME);
			FOLDER_NAME = "";
			var mode = 2;
			await tools.storescu(ctx.req.body, FILENAME, FOLDER_NAME, mode);
			ctx.response.status = 204;
			ctx.body = 'Check it out';
		}
		else{
			throw Error('Fail');
			ctx.response.status = 500;
			ctx.body = 'Api_6 Server Error';
		}
	}catch(e){
		console.log(e);
	}
});

//* FUNCTION 7 : Add annotation tag into DICOM file, then store to PACS server. */
// 直接修改dicom tag 內容
route.post("/PACS/dcmodify-annotation/", async ctx => {
	try{
		var mode = 0;
		await buildcm.add_annotation(req.body);
		await tools.storescu(ctx.req.body, ctx.req.body.InstanceUID, ctx.req.body.Folder_Name, mode);
		ctx.response.status = 204;
		ctx.body = 'Check it out';
	}catch(e){
		console.log(e);
		ctx.response.status = 500;
		ctx.body = 'Api_7 Server Error';
	}
});

app.onerror = (err) => {
	console.log('123123123');
	console.log(err.message);
}

app.listen(3030, () => {
	console.log('Listen to port 3030');
});