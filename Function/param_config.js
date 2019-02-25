const fs = require('fs');

module.exports = {
	get_param : function(info){
		var data = fs.readFileSync('./config.json', 'utf8');
		var config_json = JSON.parse(data);
		// console.log(config_json);
		// console.log(config_json.Server[info]);
		return config_json.Server[info];
	}
}
