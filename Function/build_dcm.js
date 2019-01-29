const fs = require('fs');
const xml2js = require('xml2js');
const child_process = require('child_process');
const util = require('util');

var parser = new xml2js.Parser();
var xmlBuilder = new xml2js.Builder();

var nativeModel = {"NativeDicomModel" : { "$": {"xml:space": "preserve"},"DicomAttribute": []}};

const rowTag = {"$": { "keyword": "", "tag": "", "vr": ""},"Value": [{_: "" ,"$": { "number": "1"}}]};

//Related parameters
const STORESCU_CMD = '/home/kevin/dcm4che-5.15.0/bin/storescu -c ';

module.exports = {
	parse_json2xml : async function(tagJson){
		var package_json = await jsonToXml(tagJson);
		return new Promise(function(resolve, reject){
			console.log('parse_json2xml OK step1');
			return resolve();
		});
	},
	add_annotation : function(formbody){
		return new Promise(function(resolve, reject){
			var folder_name = formbody.Folder_Name;
			var uid = formbody.InstanceUID;
			console.log(uid);
			var json_str = JSON.stringify(formbody.Ann_Content);
			console.log(json_str);
			if(json_str[0] == "\""){
				json_str = json_str.substring(1, json_str.length-1);
			}
			// var annotation_replace = json_str.replace(/\"/g, "\\\"");
			console.log("ready to execute tool kit");
			console.log("=================annotation_replace======================");
			//console.log(annotation_replace);
		
			// child_process.exec("dcmodify -i \"(3006,0050)=" + annotation_replace + "\" ./retrieve/" + folder_name + "/" + uid);
			child_process.exec("dcmodify -i \"(3006,0050)=" + json_str + "\" ./retrieve/" + folder_name + "/" + uid);
			console.log('execute finshed');
			return resolve();
		});
	}
}

async function jsonToXml(tagJson){
	try{
		var json_obj = JSON.parse(tagJson);
		console.log('enter try');
	}catch(e){
		var json_obj = eval("(" + tagJson + ")");
		console.log('enter catch');
	}
	var xml_save = xmlBuilder.buildObject(json_obj);
	fs.writeFile('./metadata/patient.xml', xml_save);
	return new Promise(function(resolve, reject){
		return resolve();
	});
}

async function create_tag(tagJson){
	var middle_tag = await search_name(tagJson);
	for(i=0;i<middle_tag.length;i++){
		var addTag = JSON.parse(middle_tag[i]);
		nativeModel.NativeDicomModel.DicomAttribute.push(addTag);
	}
	console.log(nativeModel);
	console.log(JSON.stringify(nativeModel));

	var xml_save = xmlBuilder.buildObject(nativeModel);
	fs.writeFile('./metadata/patient.xml', xml_save);
}

function search_name(tagJson){
	return new Promise(function(resolve, reject){
		var arr_json = [];
		fs.readFile('./Tags_Table.json', function(err, data){
			var rowJson = JSON.parse(tagJson);
			console.log(rowJson.length);
			var obj = JSON.parse(data);
			for(i=0;i<rowJson.length;i++){
				for(j=0;j<obj.length;j++){
					if(obj[j].Tag == rowJson[i].tag){
						rowTag.$.keyword = obj[j].tagName;
						rowTag.$.tag = rowJson[i].tag;
						rowTag.$.vr = obj[j].vr;
						rowTag.Value[0]._ = rowJson[i].vr;
						arr_json[i] = JSON.stringify(rowTag);
					}
				}
			}
			return resolve(arr_json);
		});
	});
}