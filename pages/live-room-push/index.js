// pages/live-room-push/index.js

let { ZegoExpressEngine } = require("../lib/ZegoExpressMiniProgram-1.6.0");
let { getLoginToken } = require("../../utils/util.js");

let zg;
let zgPusher;

const TAG_NAME = 'LIVE_ROOM_PUSH';

const app = getApp();
let { appID, server, logUrl } = app.globalData;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    appID: appID,
    server: server,
    logUrl: logUrl,
    roomID: "",
    userID: "",
    userName: "",
    pusherInfo: {
      streamID: "",
      url: "rtmp://"
    },
    beginToPush: false,
    publishing: false,

    mode: 'SD',
    waitingImage:'https://mc.qcloudimg.com/static/img/daeed8616ac5df256c0591c22a65c4d3/pause_publish.jpg',
    enableCamera:true,
    orientation: "vertical",
    objectFit: "contain",
    beauty:4,
    whiteness:4,

    minCache: 1,
    maxCache: 3,
    muted: false,
    debug: false,
    autoFocus: true,
    aspect:'9:16',
    minBitrate: 200,
    maxBitrate: 1000,
    zoom: false,
    devicePosition:'front',  //初始化摄像头为前置还是后置，只能初始化的时候设置，动态调整用switchCamera
    frontCamera: true,
    mirror: false,
    localMirror: 'disable'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const { roomID } = options;
    console.log(roomID);
    this.setData({
      roomID
    })
    wx.setNavigationBarTitle({ title: roomID })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    let timestamp = new Date().getTime();
    this.data.userID = 'u' + timestamp;
    this.data.userName = 'nick' + timestamp;
    this.data.pusherInfo.streamID = 's' + timestamp;
    zg = new ZegoExpressEngine(this.data.appID, this.data.server);
    zg.setLogConfig({
      logLevel: 'debug',
      remoteLogLevel: 'debug',
      logURL: this.data.logUrl
    })

    this.bindCallBack();

    zgPusher = this.selectComponent("#zg-pusher");
    console.log('zgPusher', zgPusher);
    zgPusher.startPreview();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    zg && zg.stopPublishingStream(this.data.pusherInfo.streamID);
    zgPusher && zgPusher.stop();
    zg && zg.logoutRoom(this.data.roomID);
  },

  bindCallBack() {
    zg.on('roomStateUpdate', (roomID, state, errorCode) => {
      console.log(TAG_NAME, 'roomStateUpdate', roomID, state, errorCode);
    })
    zg.on('publisherStateUpdate', ({ streamID, state, errorCode }) => {
      console.warn(TAG_NAME, 'publisherStateUpdate', state, streamID, errorCode);
      this.setData({
        publishing: state === 'PUBLISHING' ? true : false,
        beginToPush: false
      })
      if (state === 'NO_PUBLISH') {
        zgPusher.stop();
        wx.showModal({
          title: '提示',
          content: '推流失败,请重试',
          showCancel: false,
          success(res) {
            // 用户点击确定，或点击安卓蒙层关闭
            if (res.confirm || !res.cancel) {
              
            }
          }
        })
      } 
    })

    zg.on('publishQualityUpdate', (streamID, status) => {
      console.log(`${TAG_NAME}  onPublishQualityUpdate ${streamID}`, status);
    });
  },

  onPushClick() {
    if (this.data.beginToPush) return;

    this.setData({
      beginToPush: true
    })
    if (!this.data.publishing) {
      getLoginToken(this.data.userID, appID).then(token => {
        zg.loginRoom(this.data.roomID, token, { userID: this.data.userID, userName: this.data.userName })
        .then(result => {
          console.log(TAG_NAME, 'login room succeeded', result);
          zg.startPublishingStream(this.data.pusherInfo.streamID).then(({ streamID, url}) => {
                this.data.pusherInfo = {
                  streamID,
                  url
                }
                this.setData({
                  pusherInfo: this.data.pusherInfo
                }, () => {
                  zgPusher.start();
                })
          });
        }).catch(err => {
          console.error(TAG_NAME, 'login room fail', err);
        })
      })
    } else {
      zg.stopPublishingStream(this.data.pusherInfo.streamID);
      zgPusher.stop();
      this.data.pusherInfo = { streamID: '', url: '' }
      this.setData({
        publishing: false,
        beginToPush: false,
        pusherInfo: this.data.pusherInfo
      })
    }

  },

  onSwitchCameraClick: function () {
    this.data.frontCamera = !this.data.frontCamera;
    this.setData({
      frontCamera: this.data.frontCamera
    })
    zgPusher.switchCamera();
  },
  onBeautyClick: function () {
    if (this.data.beauty != 0) {
      this.data.beauty = 0;
      this.data.whiteness = 0;
    } else {
      this.data.beauty = 6.3;
      this.data.whiteness = 3.0;
    }

    this.setData({
      beauty: this.data.beauty,
      whiteness: this.data.whiteness
    })
  },
  onSwitchMode: function () {
    var showTips = !this.data.showHDTips;
    this.setData({
      showHDTips: showTips
    })
  },
  onModeClick: function (event) {
    var mode = "SD";
    switch (event.target.dataset.mode) {
      case "SD":
        mode = "SD";
        break;
      case "HD":
        mode = "HD";
        break;
      case "FHD":
        mode = "FHD";
        break;
    }

    this.setData({
      mode: mode,
      showHDTips: false
    })
  },
  onMuteClick: function () {
    this.setData({
      muted: !this.data.muted
    })
  },
  onEnableCameraClick: function () {
    this.setData({
      enableCamera: !this.data.enableCamera
    }, () => {
      // if (this.data.playing) {
        zgPusher.stop();
        setTimeout(() => {
          zgPusher.start();
        }, 100)
      // }
    })
    
  },
  onOrientationClick: function () {
    if (!this.data.enableCamera) {
      wx.showToast({
        icon: 'none',
        title: '请先开启摄像头'
      })
      return;
    }
    if (this.data.orientation == "vertical") {
      this.data.orientation = "horizontal";
    } else {
      this.data.orientation = "vertical";
    }
    this.setData({
      orientation: this.data.orientation
    })
  },
  onLogClick: function () {
    this.setData({
      debug: !this.data.debug,
    })
  },
  onSnapshotClick: function () {
    zgPusher.snapshot({
      success: function (res){
        wx.saveImageToPhotosAlbum({
          filePath: res.tempImagePath
        })
        console.log(res)
      },
      fail:function(res) {
        console.log(res)
      }
    });
  },
  onMirrorClick() {
    this.setData({
      mirror: !this.data.mirror
    });
  },
  onLocalMirrorClick() {
    console.warn('localMirror', this.data.localMirror);
    const localMirror = this.data.localMirror === 'enable' ? 'disable' : 'enable';
    this.setData({
      localMirror 
    })
  },
  onPushStateChange(e) {
    console.log(
      `${TAG_NAME} onPushStateChange `, 
      e.detail.code ,
      e.detail.message
    );
    if (this.data.beginToPush) {
      zg.updatePlayerState(this.data.pusherInfo.streamID, e);
    }
    
  },
  onPushNetStateChange(e) {
    console.log(
      `${TAG_NAME} onPushNetStateChange `,
      e.detail.info
    );
    if (this.data.beginToPush) {
      zg.updatePlayerNetStatus(this.data.pusherInfo.streamID, e);
    }
  },
  
})