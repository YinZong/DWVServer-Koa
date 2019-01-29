const fs = require("fs");
const BUFFER = 2;
const filepath = ["./retrieve/", "./dcmFiles/"];

module.exports = {
	folder_manger : async function(path){
		var FOLDER_NAME =  await main(path);
		return new Promise(function(resolve, reject){
			return resolve(FOLDER_NAME);
		});
	}
}
async function main(path){
	await folder_buffer(path);
	var FolderName = await create_folder(path);
	return new Promise(function(resolve, reject){
		return resolve(FolderName);
	});
}

function getRamdonName(max){
	return Math.floor(Math.random() * Math.floor(max)).toString();
}

function create_folder(path){
	return new Promise(function(resolve, reject){
		folder_name = Date.now().toString();
		fs.mkdirSync(filepath[path] + folder_name, 0777);
		return resolve(folder_name);
	});
}

function delete_folder(folderName, path){
	try{
		return new Promise(function(resolve, reject){
			var delete_path = filepath[path] + folderName;
			fs.readdir(delete_path, function(err, files){
				for(i=0;i<files.length;i++){
					fs.unlinkSync(delete_path + "/" + files[i]);
				}
				fs.rmdirSync(filepath[path] + folderName + "/");
				return resolve();
			});	
		
		});
	}catch(err){
		console.log(err);
	}
}

function overtime_folder(path){
	try{
		var COUNT = 0;
		var max = 0;
		var time = Date.now();
		var num = 0;
		return new Promise(function(resolve, reject){
			fs.readdir(filepath[path], function(err, folders){
				while(COUNT < folders.length){
					var diff_time = time - parseInt(folders[COUNT]);
					if(diff_time > max){
						max = diff_time;
						num = folders[COUNT];
					}
					COUNT = COUNT + 1;
				}
				return resolve(num);
			});
		});
	}catch(err){
		console.log(err);
	}
}

async function folder_buffer(path){
	try{
		fs.readdir(filepath[path], async function(err, files){
			if(err){
				console.log(err);
			}
			else{
				if(files.length >= BUFFER){
					var over_folder = await overtime_folder(path);
					await delete_folder(over_folder, path);
				}
			}
		});
		return new Promise(function(resolve, reject){
			return resolve();
		});
	}catch(err){
		console.log(err);
	}

}