const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

function getLoginToken(userID, appid) {
  let { tokenURL, appID } = getApp().globalData;
  let isDemoApp = [1739272706].includes(appID);
  let url = isDemoApp ? 'https://wssliveroom-demo.zego.im/token' : tokenURL;
  let data = {
      app_id: appid,
      id_name: userID,
  }
  return new Promise((res, rej) => {
      return wx.request({
          url,
          data,
          success(result) {
              console.log(">>>[liveroom-room] get login token success. token is: " + result.data);
              if (result.statusCode != 200) {
                  return;
              }
              res(result.data);

          },
          fail(e) {
              console.log(">>>[liveroom-room] get login token fail, error is: ")
              console.log(e);
              rej(e)
          }
      })
  })
}


module.exports = {
  formatTime: formatTime,
  getLoginToken,
}
