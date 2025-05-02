// recognizer.js
// 车牌识别器工具类

const recognizer = {
  // 识别图片中的车牌
  recognizePlate: function(imagePath) {
    // 返回一个Promise对象
    return new Promise((resolve, reject) => {
      // 将图片转为base64格式，便于传输
      wx.getFileSystemManager().readFile({
        filePath: imagePath,
        encoding: 'base64',
        success: res => {
          // 调用云函数或者服务器API进行识别
          // 这里使用云函数作为示例
          wx.cloud.callFunction({
            name: 'recognizePlate', // 云函数名称
            data: {
              image: res.data // 图片的base64编码
            },
            success: result => {
              // 解析识别结果
              resolve(result.result.plateNumber);
            },
            fail: err => {
              console.error('云函数调用失败:', err);
              reject(err);
            }
          });
        },
        fail: err => {
          console.error('读取图片失败:', err);
          reject(err);
        }
      });
    });
  },
  
  // 如果暂时没有部署云函数或者服务器API，使用此方法模拟识别结果
  mockRecognizePlate: function() {
    return new Promise((resolve) => {
      // 生成随机车牌号作为测试
      const provinces = ['京', '津', '沪', '渝', '冀', '豫', '云', '辽', '黑', '湘'];
      const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
      const digits = '0123456789';
      
      let plate = provinces[Math.floor(Math.random() * provinces.length)];
      plate += letters[Math.floor(Math.random() * letters.length)];
      
      // 添加5个字符（字母或数字）
      for (let i = 0; i < 5; i++) {
        const useDigit = Math.random() > 0.5;
        if (useDigit) {
          plate += digits[Math.floor(Math.random() * digits.length)];
        } else {
          plate += letters[Math.floor(Math.random() * letters.length)];
        }
      }
      
      // 模拟网络延迟
      setTimeout(() => {
        resolve(plate);
      }, 1500);
    });
  }
};

module.exports = recognizer; 