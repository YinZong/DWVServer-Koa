const fs = require('fs');
const xml2js = require('xml2js');
const {spawn} = require('child_process');
const child_process = require('child_process');

var parser = new xml2js.Parser();
var xmlBuilder = new xml2js.Builder();
const filepath = ["./retrieve/", "./dcmFiles/"];
const folderPath = ["./Images/", "./dcmCache/"];

//Related parameters
const STORESCU_CMD = '/home/kevin/dcm4che-5.15.0/bin/storescu -c ';

module.exports = {
	resetDir: function(){
		fs.readdir(filepath[1], function(err, files){
			if(err){
				console.log(err);
			}
			else spawn('rm', [filepath[1] + '3456.dcm']);
		});
		fs.readdir(folderPath[0], function(err, files){
			if(err){
				console.log(err);
			}
			else spawn('rm', [folderPath[0] + files[0]]);
		});
		spawn('rm', ['./json/patient.json', './json/studies.json', './json/series.json']);
	},
	cleanFolder: function(filename, mode){
		return new Promise(function(resolve, reject){
			fs.readdir(folderPath[mode], function(err, files){
				console.log(filename);
				for(i=0;i<files.length;i++){
					if(files[i] != filename){
						fs.unlinkSync(folderPath[mode] + files[i]);
					}
				}
			});
			return resolve();
		});
	},
	xmlCreater: function(Form, date, time){
		fs.readFile("./metatemplate.xml", function(err, data){
			if(err){
				console.log('Fail to read file!\n' + err);
			}
			parser.parseString(data, function(err, res){
				if(err){
					console.log('Parser Fail!\n' + err);
				}
				// console.log(util.inspect(res, false, null));
				res.NativeDicomModel.DicomAttribute[0].Value = [{_: Form.PatientID, '$': {number: '1'}}];
				res.NativeDicomModel.DicomAttribute[1].Value = [{_: Form.PatientName, '$': {number: '1'}}];
				res.NativeDicomModel.DicomAttribute[2].Value = [{_: Form.PatientBirthday, '$': {number: '1'}}];
				res.NativeDicomModel.DicomAttribute[3].Value = [{_: Form.PatientSex, '$': {number: '1'}}];
				res.NativeDicomModel.DicomAttribute[4].Value = [{_: date, '$': {number: '1'}}];
				res.NativeDicomModel.DicomAttribute[5].Value = [{_: time, '$': {number: '1'}}];
				var xml_save = xmlBuilder.buildObject(res);
				fs.writeFile('./metadata/patient.xml', xml_save);
			});
		});
		cmdRun();
	},
	jpg2dcm: async function(formdata, FILENAME, FOLDERNAME){
		console.log(formdata);
		var pacs_ip = formdata.ipAddr;
		var pacs_port = formdata.Port;
		var pacs_title = formdata.Title;
		await jpg2dcm_cmdRun(formdata, FILENAME, FOLDERNAME);
		return new Promise(function(resolve, reject){
			console.log(FOLDERNAME);
			child_process.exec(STORESCU_CMD + pacs_title + '@' + pacs_ip + ':' + pacs_port + ' ./dcmFiles/' + FOLDERNAME + '/3456.dcm');
			console.log('jpg2dcm ok step2');
			return resolve();
		});
	},
	dcm2img: function(){
		fs.readdir(filepath[1], function(err, files){
			if(err){
				console.log(err);
			}
			else{
				console.log('./dcmFiles/' + files[0]);
				spawn('dcm2jpg', ['./dcmFiles/' + files[0], './Images/img.jpg']);
			} 
		});	
	},
	storescu: async function(formdata, FILENAME, FOLDERNAME, MODE){
		try{
			var pacs_ip = formdata.ipAddr;
			var pacs_port = formdata.Port;
			var pacs_title = formdata.Title;
			return new Promise(function(resolve, reject){
				child_process.exec(STORESCU_CMD + pacs_title + '@' + pacs_ip + ':' + pacs_port + ' ' + filepath[MODE] + FOLDERNAME + '/' + FILENAME);
				console.log('DICOM file uploaded to PACS server.');
				return resolve();
			});
		}catch(err){
			console.log(err);
		}
	}
}

function cmdRun(){
	fs.readdir(folderPath[0], function(err, files){
		if(err){
			console.log(err);
		}
		spawn('jpg2dcm', ['-f', './metadata/patient.xml', './Images/' + files[0], './dcmFiles/3456.dcm']);
	});
}

function jpg2dcm_cmdRun(formdata, filename, foldername){
	return new Promise(function(resolve, reject){
		console.log(filename);
		child_process.exec('jpg2dcm  -f ./metadata/patient.xml ./Images/' + filename + ' ./dcmFiles/' + foldername + '/3456.dcm');
		return resolve();
	});
}