// index.js
// const app = getApp()
const app = getApp()
Page({
  data: {
    roomID: '',
    debugMode: false,
    mode: '',
    headerHeight: app.globalData.headerHeight,
    statusBarHeight: app.globalData.statusBarHeight,
  },

  onLoad: function(options) {
    console.log(options);
    this.setData({
      mode: options.type === 'push' ? '推流' : '拉流',
      type: options.type
    })
  },
  enterRoomID: function(event) {
    // console.log('index enterRoomID', event)
    this.setData({
      roomID: event.detail.value,
    })
  },
  switchDebugMode: function(event) {
    console.log('index switchDebugMode', event)
    this.setData({
      debugMode: event.detail.value,
    })
  },
  enterRoom: function() {
    const roomID = this.data.roomID
    const nowTime = new Date()
    if (nowTime - this.data.tapTime < 1000) {
      return
    }
    if (!roomID) {
      wx.showToast({
        title: '请输入房间号',
        icon: 'none',
        duration: 2000,
      })
      return
    }
    let url = this.data.type === 'push' ? '../live-room-push/index' : '../live-room-play/index';
    url += `?roomID=${roomID}`
    wx.navigateTo({
      url: url,
    })
    this.setData({ 'tapTime': nowTime })
  },
  onBack: function() {
    wx.navigateBack({
      delta: 1,
    })
  },
})
