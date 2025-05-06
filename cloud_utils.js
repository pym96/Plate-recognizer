/*
 * cloud_utils.js
 * Handles utility functions for WeChat Mini Program, including API calls for plate recognition.
 * Updated to use public Flask API endpoint and ensure showLoading/hideLoading pairing.
 */

const API_BASE_URL = 'http://123.57.63.76:8888'; // Use ngrok URL if needed, e.g., 'http://abc123.ngrok.io'

// Convert image to Base64
function imageToBase64(imagePath) {
  console.log('准备将图片转换为Base64:', imagePath);
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().readFile({
      filePath: imagePath,
      encoding: 'base64',
      success: res => {
        console.log('图片转Base64成功，数据长度:', res.data.length);
        resolve(res.data);
      },
      fail: err => {
        console.error('图片转Base64失败:', err);
        reject(err);
      }
    });
  });
}

// Call the Flask API for plate recognition
function recognizePlate(base64Image) {
  console.log('开始调用真实API进行车牌识别，发送数据到:', `${API_BASE_URL}/recognize_plate`);
  console.log('使用的API基础地址:', API_BASE_URL);

  return new Promise((resolve, reject) => {
    wx.showLoading({ title: '识别中...' });
    wx.request({
      url: `${API_BASE_URL}/recognize_plate`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: {
        image: base64Image
      },
      timeout: 10000, // 10-second timeout
      success: res => {
        console.log('API响应:', res);
        if (res.statusCode === 200) {
          // Format the response to match what apiRecognizer.js expects
          if (res.data && res.data.plate_number) {
            // If using plate_number format
            resolve({ 
              plateNumber: res.data.plate_number 
            });
          } else if (res.data && res.data.plateNumber) {
            // If already using plateNumber format
            resolve(res.data);
          } else if (res.data && typeof res.data === 'string') {
            // If the response is directly the plate number as a string
            resolve({ 
              plateNumber: res.data 
            });
          } else {
            console.error('API返回格式异常:', res.data);
            reject(new Error('API返回格式异常'));
          }
        } else {
          console.error('API返回错误:', res.data.error || '未知错误');
          reject(new Error(res.data.error || 'API返回错误'));
        }
      },
      fail: err => {
        console.error('车牌识别API请求失败，详细错误:', err);
        reject(new Error('API请求失败: ' + err.errMsg));
      },
      complete: () => {
        wx.hideLoading(); // Ensure hideLoading is called
      }
    });
  });
}

module.exports = {
  imageToBase64,
  recognizePlate
};