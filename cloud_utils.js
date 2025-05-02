// cloud_utils.js
// 本地Python后端API调用工具

// 获取全局应用实例
const app = getApp();

// 本地服务器地址配置
const API_CONFIG = {
  // 从全局应用配置中获取API基础地址
  get BASE_URL() {
    return app.globalData.apiBase || 'http://127.0.0.1:8888';
  },
  // API路径
  RECOGNIZE_PLATE_URL: '/recognize_plate',
  HEALTH_CHECK_URL: '/health'
};

/**
 * 检查API服务器健康状态
 * @returns {Promise} 包含健康状态信息的Promise
 */
function checkApiHealth() {
  console.log('正在检查API服务器健康，地址:', API_CONFIG.BASE_URL);
  
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_CONFIG.BASE_URL}${API_CONFIG.HEALTH_CHECK_URL}`,
      method: 'GET',
      success: (res) => {
        console.log('API健康检查结果:', res.data);
        resolve(res.data);
      },
      fail: (err) => {
        console.error('API健康检查失败:', err);
        reject(err);
      }
    });
  });
}

/**
 * 发送图片到本地服务器进行车牌识别
 * @param {string} base64Image - Base64编码的图片数据
 * @returns {Promise} 包含识别结果的Promise
 */
function recognizePlate(base64Image) {
  const url = `${API_CONFIG.BASE_URL}${API_CONFIG.RECOGNIZE_PLATE_URL}`;
  console.log('开始调用真实API进行车牌识别，发送数据到:', url);
  console.log('使用的API基础地址:', API_CONFIG.BASE_URL);
  
  return new Promise((resolve, reject) => {
    // 显示加载状态，提示用户请求进行中
    wx.showLoading({
      title: '正在识别...',
      mask: true
    });
    
    // 准备请求数据
    const postData = {
      image: base64Image
    };
    
    // 记录发送时间用于计算延迟
    const startTime = Date.now();
    
    wx.request({
      url: url,
      method: 'POST',
      data: postData,
      timeout: 30000, // 延长超时时间到30秒
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        const endTime = Date.now();
        const latency = endTime - startTime;
        
        wx.hideLoading();
        console.log(`车牌识别API响应成功，耗时: ${latency}ms，状态码:`, res.statusCode);
        console.log('响应数据:', res.data);
        
        if (res.data && res.data.success) {
          resolve({
            plateNumber: res.data.plate_number,
            processTime: res.data.process_time,
            latency: latency
          });
        } else {
          const errorMsg = (res.data && res.data.error) || '识别失败，服务器未返回有效结果';
          console.error('API返回错误:', errorMsg);
          
          wx.showToast({
            title: errorMsg,
            icon: 'none',
            duration: 2000
          });
          
          reject(new Error(errorMsg));
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('车牌识别API请求失败，详细错误:', JSON.stringify(err));
        
        // 检查是否是连接问题
        let errorMessage = '连接服务器失败';
        if (err.errMsg) {
          if (err.errMsg.includes('timeout')) {
            errorMessage = '请求超时，服务器响应过慢';
          } else if (err.errMsg.includes('ERR_CONNECTION_REFUSED')) {
            errorMessage = '连接被拒绝，服务器可能未运行';
            // 尝试重新连接备用地址
            app.tryAlternativeApiConnection();
          }
        }
        
        // 显示友好的错误提示
        wx.showToast({
          title: errorMessage,
          icon: 'none',
          duration: 2000
        });
        
        reject(err);
      },
      complete: () => {
        // 确保隐藏加载提示
        wx.hideLoading();
      }
    });
  });
}

/**
 * 将本地图片文件转换为Base64编码
 * @param {string} filePath - 本地图片文件路径
 * @returns {Promise<string>} 返回Base64编码的图片数据
 */
function imageToBase64(filePath) {
  console.log('准备将图片转换为Base64:', filePath);
  
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().readFile({
      filePath: filePath,
      encoding: 'base64',
      success: (res) => {
        console.log('图片转Base64成功，数据长度:', res.data.length);
        resolve(res.data);
      },
      fail: (err) => {
        console.error('读取图片失败:', err);
        
        wx.showToast({
          title: '图片处理失败',
          icon: 'none',
          duration: 2000
        });
        
        reject(err);
      }
    });
  });
}

module.exports = {
  checkApiHealth,
  recognizePlate,
  imageToBase64,
  API_CONFIG
}; 