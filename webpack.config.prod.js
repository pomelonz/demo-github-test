var path = require('path');
var webpack = require('webpack');

module.exports = {
	entry: path.resolve(__dirname, 'app/js/webpack/app.js'),
    output: {
        path: path.resolve(__dirname, 'view/js'),
        filename: 'bundle.min.js'
    },

    module: {
    	loaders: [
    		{
    			test: /\.jsx?$/,
    			exclude: /node_modules/,
    			loader: 'babel-loader'
    		}
    	]
    },

    plugins: [
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin({
          compress: {
            warnings: false
          }
        })
    ]
};
