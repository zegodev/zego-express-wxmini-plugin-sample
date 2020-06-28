//app.js
App({
  onLaunch: function () {
    
  },
  globalData: {
    appID: 1739272706,
    server: "wss://webliveroom-test.zego.im/ws",
    logUrl: "https://weblogger-test.zego.im/httplog",
    tokenURL: 'https://wsliveroom-alpha.zego.im:8282/token', // 即构提供的测试环境的测试接口，正式环境要由业务服务端实现
  }
})