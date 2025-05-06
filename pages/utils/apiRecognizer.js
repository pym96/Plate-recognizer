// apiRecognizer.js
// 使用本地Python API的车牌识别器

const cloudUtils = require('../../cloud_utils');

const apiRecognizer = {
  // 识别车牌
  recognizePlate: function(imagePath) {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('apiRecognizer: 开始通过本地Python API识别车牌:', imagePath);
        
        wx.showLoading({
          title: '正在识别...',
        });
        
        // 1. 将图片转换为Base64
        const base64Image = await cloudUtils.imageToBase64(imagePath);
        console.log('图片已转换为Base64，长度:', base64Image.length);
        
        // 2. 调用Python API进行识别
        const result = await cloudUtils.recognizePlate(base64Image);
        console.log('API识别结果:', result);
        
        wx.hideLoading();
        
        if (result && result.plateNumber) {
          console.log('apiRecognizer: API识别成功，车牌号:', result.plateNumber);
          // 返回车牌号字符串
          resolve(result.plateNumber);
        } else {
          console.error('API识别失败，无识别结果');
          reject(new Error('无法识别车牌'));
        }
      } catch (err) {
        wx.hideLoading();
        console.error('API识别过程出错:', err);
        reject(err);
      }
    });
  }
};

module.exports = apiRecognizer; 