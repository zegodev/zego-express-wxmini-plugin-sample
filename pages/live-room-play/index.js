// pages/live-room-play/index.js
let { ZegoExpressEngine } = require("../lib/ZegoExpressMiniProgram-1.6.0");
let { getLoginToken } = require("../../utils/util.js");

let zg;
let zgPlayer;

const TAG_NAME = 'LIVE_ROOM_PLAY';

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
    playing: false,
    beginToPlay: false,

    orientation: 'vertical',
    objectFit: 'fillCrop',
    minCache: 1,
    maxCache: 3,
    muted: false,
    debug: false,
    pictureInPictureMode: "pop",

    playerInfo: {
      streamID: "",
      url: ""
    }
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
    
    zg = new ZegoExpressEngine(this.data.appID, this.data.server);
    zg.setLogConfig({
      // logLevel: 'debug',
      // remoteLogLevel: 'debug',
      logURL: this.data.logUrl
    })

    this.bindCallBack();

    zgPlayer = this.selectComponent("#zg-player");
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
    zg && zg.stopPlayingStream(this.data.playerInfo.streamID);
    zgPlayer && zgPlayer.stop();
    zg && zg.logoutRoom(this.data.roomID);
  },

  bindCallBack() {
    let that = this;
    // zg.onStreamUrlUpdate = (streamID, url, type) => {
    //   console.warn(`${TAG_NAME} onStreamUrlUpdate ${streamID} ${type === 0 ? 'play' : 'publish'} ${url}`);

    //   if (type === 0) {
    //     that.data.playerInfo.streamID = streamID;
    //     that.data.playerInfo.url = url;

    //     that.setData({
    //       playerInfo: that.data.playerInfo
    //     }, () => {
    //       console.error(that.data.playerInfo, zgPlayer)

    //       zgPlayer.play();
    //     })
    //   }
    // };
    zg.on('roomStreamUpdate', (roomID, updatedType, streamList) => {
      console.log(`${TAG_NAME} onStreamUpdated ${roomID} ${updatedType === 0 ? 'added' : 'deleted'}`);
      console.log(streamList);

      if (updatedType === 'DELETE') {
        if (streamList.find(item => item.streamID === this.data.playInfo.streamID)) {
          zg.stopPlayingStream(this.data.playInfo.streamID);
          zgPlayer.stop();
          that.setData({
            playInfo: {
              streamID: "",
              url: ""
            }
          })
        }
        
      } else {

        if (!that.data.playing && that.data.beginToPlay) {
          zg.startPlayingStream(streamList[0].streamID).then(({ streamID, url }) => {
            console.warn(TAG_NAME, 'startPlayingStream', streamID, url);
            that.data.playerInfo.streamID = streamID;
            that.data.playerInfo.url = url;

            that.setData({
              playerInfo: that.data.playerInfo
            }, () => {
              console.error(that.data.playerInfo, zgPlayer)

              zgPlayer.play();
            })
          }).catch(err => {
            console.warn(TAG_NAME, 'startPlayingStream', err);

          });
        }
      }
    });
    zg.on('playerStateUpdate', ({ streamID, state, errorCode }) => {
      console.log(`${TAG_NAME} onPlayStateUpdate ${streamID} ${state} ${errorCode}`);

      that.setData({
        playing: state === 'PLAYING' ? true : false,
        beginToPlay: false
      })

      if (state === 'NO_PLAY') {
        // 流播放失败, 停止拉流
        zgPlayer.stop();
        wx.showModal({
          title: '提示',
          content: '拉流失败,请重试',
          showCancel: false,
          success(res) {
            // 用户点击确定，或点击安卓蒙层关闭
            if (res.confirm || !res.cancel) {
              
            }
          }
        })
      } 

    });

    zg.on('playQualityUpdate', (streamID, stats) => {
      console.log(`${TAG_NAME} onPlayStateUpdate ${streamID}`, stats);
    });
  },

  onPlayClick() {
    if (this.data.beginToPlay) return;
    
    this.setData({
      beginToPlay: true
    })
    if (!this.data.playing) {
      getLoginToken(this.data.userID, appID).then(token => {
        zg.loginRoom(this.data.roomID, token, { userID: this.data.userID, userName: this.data.userName })
        .then(result => {
          if (result) {
            console.log(TAG_NAME, 'login room succeeded');
        
          }
        }).catch(err => {
          console.error(TAG_NAME, 'login room fail', err);
        })
      })
    } else {
      zg.stopPlayingStream(this.data.playerInfo.streamID);
      zgPlayer.stop();
      this.data.playerInfo = { streamID: '', url: '' }
      this.setData({
        playing: false,
        beginToPlay: false,
        playerInfo: this.data.playerInfo
      })
    }
  },

  onOrientationClick: function() {
    if (this.data.orientation == "vertical") {
      this.data.orientation = "horizontal";
    } else {
      this.data.orientation = "vertical";
    }
    this.setData({
      orientation: this.data.orientation
    })
  },

  onLogClick: function() {
    this.setData({
      debug: !this.data.debug
    })
  },

  onMuteClick: function() {
    this.setData({
      muted: !this.data.muted
    })
  },

  onPlayStateChange(e) {
    console.log(
      `${TAG_NAME} onPlayStateChange, `,
      e.detail.code,
      e.detail.message
    );
    zg.updatePlayerState(e.detail.streamID, e);
  },

  onPlayNetStateChange(e) {
    console.log(
      `${TAG_NAME} onPlayNetStateChange `,
      e.detail.info
    );
    zg.updatePlayerNetStatus(e.detail.streamID, e);
  },

  onEnterPictureInPicture(e) {
    console.error(`${TAG_NAME} onEnterPictureInPicture`, e);
  },

  onLeavePictureInPicture(e) {
    console.error(`${TAG_NAME} onLeavePictureInPicture`, e);
  }
})