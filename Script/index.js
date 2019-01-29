function checkjpg(jpg_file){
	var validFormat = new Array(".jpg", ".jpeg");
	var jpgfile = jpg_file.value;

	fileExt = jpgfile.substring(jpgfile.lastIndexOf('.'));
	if(validFormat.indexOf(fileExt) < 0){
		alert("Your file is valid. Please check your file whether .jpg or .jpeg format.");
		jpg_file.value = null;
		return false;
	}
	else return true;
}
function checkdcm(dcm_file){
	var legalFormat = new Array(".dcm");
	var dcmfile = dcm_file.value;

	fileExt = dcmfile.substring(dcmfile.lastIndexOf('.'));
	if(legalFormat.indexOf(fileExt) < 0){
		alert("Your file is valid. Please check your file whether .dcm format.");
		dcm_file.value = null;
		return false;
	}
	else return true;

}
function checkform1(form){
	if(selectjpg.value == ""){
		alert("You don't choose file. Please select file.");
		return false;
	}
	else return true;
}
function checkform2(form){
	if(selectdcm.value == ""){
		alert("You don't choose file. Please select file.");
		return false;
	}
	else return true;
}