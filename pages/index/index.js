// index.js
const recognizerManager = require('../utils/recognizerManager');

// 获取应用实例
const app = getApp();

const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Page({
  data: {
    title: '车牌识别系统',
    plateNumber: '',
    plateImage: '',
    hasResult: false,
    recognizerType: 'mock' // 默认使用模拟识别器
  },

  onLoad: function() {
    // 获取当前的识别器类型
    this.setData({
      recognizerType: recognizerManager.currentRecognizerType
    });
  },
  
  // 拍照识别
  goToCamera: function() {
    wx.navigateTo({
      url: '/pages/camera/camera'
    });
  },
  
  // 上传识别
  goToUpload: function() {
    wx.navigateTo({
      url: '/pages/upload/upload'
    });
  },
  
  // 处理识别结果
  onResultReceived: function(plateNumber, imagePath) {
    this.setData({
      plateNumber: plateNumber,
      plateImage: imagePath,
      hasResult: true
    });
  },
  
  // 清除结果
  clearResult: function() {
    this.setData({
      plateNumber: '',
      plateImage: '',
      hasResult: false
    });
  },
  
  // 切换识别器类型
  switchRecognizerType: function() {
    // 在四种识别器之间循环切换：mock -> onnx -> cloud -> api -> mock
    let newType = 'mock';
    
    switch(this.data.recognizerType) {
      case 'mock':
        newType = 'onnx';
        break;
      case 'onnx':
        newType = 'cloud';
        break;
      case 'cloud':
        newType = 'api';
        break;
      case 'api':
        newType = 'mock';
        break;
      default:
        newType = 'mock';
    }
    
    if (recognizerManager.setRecognizerType(newType)) {
      this.setData({
        recognizerType: newType
      });
      
      const typeNames = {
        'mock': '模拟识别',
        'onnx': 'ONNX模型',
        'cloud': '云端识别',
        'api': 'Python API'
      };
      
      wx.showToast({
        title: `切换为${typeNames[newType]}`,
        icon: 'none'
      });
    }
  }
});
