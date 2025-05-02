// cloudRecognizer.js
// 使用云函数进行车牌识别的模块

const cloudRecognizer = {
  // 识别车牌图片
  recognizePlate: function(imagePath) {
    return new Promise((resolve, reject) => {
      console.log('cloudRecognizer: 开始上传图片到云函数进行识别:', imagePath);
      
      // 首先将图片上传到云存储
      wx.showLoading({
        title: '正在上传图片...',
      });
      
      const uploadTask = wx.cloud.uploadFile({
        cloudPath: `plate_images/${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`,
        filePath: imagePath,
        success: res => {
          console.log('图片上传成功，fileID:', res.fileID);
          
          wx.showLoading({
            title: '正在识别...',
          });
          
          // 调用云函数识别车牌
          wx.cloud.callFunction({
            name: 'recognizePlate',
            data: {
              fileID: res.fileID // 传递图片ID给云函数
            },
            success: result => {
              console.log('云函数调用成功:', result);
              wx.hideLoading();
              
              const { success, plateNumber, error } = result.result;
              
              if (success) {
                console.log('cloudRecognizer: 云端识别结果:', plateNumber);
                resolve(plateNumber);
              } else {
                console.error('云函数识别失败:', error);
                reject(new Error('识别失败: ' + error));
              }
              
              // 识别完成后，删除云存储中的临时图片
              wx.cloud.deleteFile({
                fileList: [res.fileID],
                success: delRes => {
                  console.log('临时图片删除成功');
                },
                fail: delErr => {
                  console.error('删除临时图片失败:', delErr);
                }
              });
            },
            fail: err => {
              wx.hideLoading();
              console.error('调用云函数失败:', err);
              reject(err);
            }
          });
        },
        fail: err => {
          wx.hideLoading();
          console.error('上传图片失败:', err);
          reject(err);
        }
      });
      
      // 监听上传进度
      uploadTask.onProgressUpdate(res => {
        console.log('上传进度:', res.progress);
      });
    });
  }
};

module.exports = cloudRecognizer; 