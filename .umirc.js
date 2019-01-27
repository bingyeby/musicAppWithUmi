// ref: https://umijs.org/config/
let path = require('path')
export default {
  treeShaking: true,
  plugins: [
    // ref: https://umijs.org/plugin/umi-plugin-react.html
    ['umi-plugin-react', {
      antd: true,
      dva: true,
      dynamicImport: {webpackChunkName: true},
      title: {
        defaultTitle: 'syl.music',

      },
      dll: false,
      routes: {
        exclude: [

          /models\//,
          /services\//,
          /model\.(t|j)sx?$/,
          /service\.(t|j)sx?$/,

          /components\//,
        ],
      },
    }],
  ],
  // "proxy": {
  //   "/api": {
  //     "target": "http://jsonplaceholder.typicode.com/",
  //     "changeOrigin": true,
  //     "pathRewrite": {"^/api": ""}
  //   }
  // },
  // 不纳入import的静态文件
  "copy": [
    {
      "from": "static",
      "to": "static"
    }
  ]
}
