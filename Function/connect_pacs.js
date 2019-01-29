const fs = require("fs");
const child_process = require("child_process");
const fileFolder = "./retrieve/";

// var url_obj = {"Status" : "The getscu method status.", "Folder_Name" : "The folder name.", "File_Num" : "The image amount.", "File_List" : "The instances url that is a array format.", "Files_Array" : "File array."};
var url_obj = {"Status" : "The getscu method status.", "Folder_Name" : "The folder name.", "File_Num" : "The image amount.", "File_List" : "The instances url that is a array format."};

var typeLayer = ["PATIENT", "STUDY", "SERIES", "IMAGE", "FRAME"];
var files = fs.readdirSync("./retrieve/");

//Related parameters
const GETSCU_CMD = '/home/kevin/dcm4che-5.15.0/bin/getscu -L ';

module.exports = {
	geturl : async function(form, FOLDERNAME){
		var url = await getscu_url(form, FOLDERNAME);
		return new Promise(function(resolve, reject){
			console.log(url);
			return resolve(JSON.stringify(url));
		});
	},
	getScu : async function(body, FOLDERNAME){
		var a = await getscu_series(body, FOLDERNAME);
		return new Promise(function(resolve, reject){
			console.log(a);
			return resolve(JSON.stringify(a));
		});
	}
}

async function getscu_url(body, FOLDERNAME){
	var pacs_address = body.Title + "@" + body.ipAddr + ":" + body.Port;
	var layer = check_layer(body.Study, body.Series, body.Instance);

	
	await retrieve_object(pacs_address, body.Study, body.Series, body.Instance, layer, FOLDERNAME);
	var arr_filename = await arr_sopuid(FOLDERNAME);
	// var arr_buffer = await arr_farray(arr_filename, FOLDERNAME);

	if(arr_filename[0] === undefined){
		url_obj.Status = "Fail";
		url_obj.File_Num = 0;
		url_obj.File_List = arr_filename;
		// url_obj.Files_Array = arr_buffer;
		url_obj.Folder_Name = FOLDERNAME;
	}
	if(arr_filename[0] !== undefined){
		for(i=0;i<arr_filename.length;i++){
			arr_filename[i] = "http://10.34.41.190:3030/retrieve/" + FOLDERNAME + "/" + arr_filename[i];
		}
		url_obj.Status = "OK";
		url_obj.File_Num = arr_filename.length;
		url_obj.File_List = arr_filename;
		// url_obj.Files_Array = arr_buffer;
		url_obj.Folder_Name = FOLDERNAME;
	}
	return new Promise(function(resolve, reject){
		return resolve(JSON.stringify(url_obj));
	});
}
async function getscu_series(body, FOLDERNAME){
	var connect = body.Title + "@" + body.ipAddr + ":" + body.Port;
	var layer = check_layer(body.Study1, body.Series1, body.Instance1);
	
	var study = build_study(body);
	var series = build_series(body);
	var instance = build_instance(body);
	await retrieve_object(connect, study, series, instance, layer, FOLDERNAME);
	var arr_dcmfile = await arr_sopuid(FOLDERNAME);
	// var arr_buffer = await arr_farray(arr_dcmfile, FOLDERNAME);

	if(arr_dcmfile[0] === undefined){
		url_obj.Status = "Fail";
		url_obj.File_Num = 0;
		url_obj.File_List = arr_dcmfile;
		// url_obj.Files_Array = arr_buffer;
		url_obj.Folder_Name = FOLDERNAME;
	}
	if(arr_dcmfile[0] != undefined){
		for(i=0;i<arr_dcmfile.length;i++){
			arr_dcmfile[i] = "http://10.34.41.190:3030/retrieve/" + FOLDERNAME + "/" + arr_dcmfile[i];
		}
		url_obj.Status = "OK";
		url_obj.File_Num = arr_dcmfile.length;
		url_obj.File_List = arr_dcmfile;
		// url_obj.Files_Array = arr_buffer;
		url_obj.Folder_Name = FOLDERNAME;
	}
	return new Promise(function(resolve, reject){
		return resolve(JSON.stringify(url_obj));
	});
}

function retrieve_object(connect, studyUID, seriesUID, instanceUID, Layer, FOLDERNAME){
	if(Layer == 1){
		return new Promise(function(resolve, reject){
			child_process.exec(GETSCU_CMD + typeLayer[Layer] + " -c " + connect + " -m 00020000D=" + studyUID 
		 		+ " --directory ./retrieve/" + FOLDERNAME + "/", {maxBuffer:1024*500}, function(err,stdout, stderr){
				if(err){
					console.log(err);
					return reject();
				}
				console.log(stdout);
				console.log("================================");
				return resolve();
			});
		});
	}
	else if(Layer == 2){
		return new Promise(function(resolve, reject){
			child_process.exec(GETSCU_CMD + typeLayer[Layer] + " -c " + connect + " -m 0020000D=" + studyUID +
				" -m 0020000E=" + seriesUID + " --directory ./retrieve/" + FOLDERNAME + '/', {maxBuffer:1024*500}, function(err,stdout, stderr){
				if(err){
					console.log(err);
					return reject();
				}
				console.log(stdout);
				console.log("================================");
				return resolve();
			});
		});
	}
	else if(Layer == 3){
		return new Promise(function(resolve, reject){
			child_process.exec(GETSCU_CMD + typeLayer[Layer] + " -c " + connect + " -m 0020000D=" + studyUID +
		 		" -m 0020000E=" + seriesUID + " -m 00080018=" + instanceUID +  " --directory ./retrieve/" + FOLDERNAME + '/', {maxBuffer:1024*500}, function(err,stdout, stderr){
				if(err){
					console.log(err);
					return reject();
				}
				console.log(stdout);
				console.log("================================");
				return resolve();
			});
		});
	}
}

function arr_sopuid(FOLDERNAME){
	return new Promise(function(resolve, reject){
		fs.readdir(fileFolder + FOLDERNAME + "/", function(err, files){
			var arr = [];
			for(i=0;i<files.length;i++){
				//console.log(files[i]);
				arr.push(files[i]);
			}
			//console.log(arr);
			url_obj.File_List = arr;
			console.log('DICOM files SOP have been organized!');
			return resolve(arr);
		});
		
	});
}

function arr_farray(arr_dcmfile, FOLDERNAME){
	return new Promise(function(resolve, reject){
		var file_buffer = [];
		for(i=0;i<arr_dcmfile.length;i++){	
			var buffer = fs.readFileSync('./retrieve/' + FOLDERNAME + '/' + arr_dcmfile[i]);
			file_buffer.push(buffer);
		}
		console.log(file_buffer);
		console.log('========================');
		return resolve(file_buffer);
	});
}

function check_layer(study, series, instance){
	if(study != "" &&  series != "" && instance != "")
		return 3;
	if(study != "" && series != "")
		return 2;
	if(study != "")
		return 1;
}

function build_study(STUDY){
	var Study = "";
	for(i=1;i<=12;i++){
		var str = "Study" + i.toString();
		if(i<12){
			Study = Study + STUDY[str] + ".";
		}
		else
			Study = Study + STUDY[str];
	}
	return Study;
}

function build_series(SERIES){
	var Series = "";
	for(i=1;i<=12;i++){
		var str = "Series" + i.toString();
		if(i<12){
			Series = Series + SERIES[str] + ".";
		}
		else
			Series = Series + SERIES[str];
	}
	return Series;
}

function build_instance(INSTANCE){
	var Instance = "";
	for(i=1;i<=12;i++){
		var str = "Instance" + i.toString();
		if(i<12){
			Instance = Instance + INSTANCE[str] + ".";
		}
		else
			Instance = Instance + INSTANCE[str];
	}
	return Instance;
}