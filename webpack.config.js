var path = require('path');

module.exports = {
	entry: path.resolve(__dirname, 'app/js/webpack/app.js'),
    output: {
        path: path.resolve(__dirname, 'view/js'),
        filename: 'bundle.js'
    },

    module: {
    	loaders: [
    		{
    			test: /\.jsx?$/,
    			exclude: /node_modules/,
    			loader: 'babel-loader'
    		}
    	]
    }
};
