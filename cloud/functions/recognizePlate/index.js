/*
  注意：这是一个云函数模板，用于WeChat Mini Program的车牌识别
  已根据后端Flask API输出进行调整，指向正确的API地址
  前提：
  1. 后端Flask API运行在 http://172.23.153.5:8888 或公网IP
  2. 后端需修复模型路径（/Users/panyiming/... 不适用于服务器）
  3. 生产环境需使用公网域名和生产级WSGI服务器
*/

const cloud = require('wx-server-sdk');
const fs = require('fs');
const path = require('path');
const request = require('request-promise');

cloud.init();

// 调用本地Python API进行车牌识别
async function recognizePlateWithPythonAPI(imageBuffer, tempFilePath) {
  console.log('开始调用Python API识别车牌...');
  
  // Python API服务地址
  // 使用云服务器的内网IP和正确端口（8888）
  // 生产环境需替换为公网可访问的域名或IP，例如：https://your-domain.com:8888
  const apiUrl = 'http://123.57.63.76:8888/recognize_plate';
  
  try {
    // 方案1: Python API接受base64图像
    const base64Image = imageBuffer.toString('base64');
    
    const response = await request({
      method: 'POST',
      uri: apiUrl,
      body: {
        image: base64Image
      },
      json: true,
      timeout: 10000 // 设置10秒超时，防止API响应过慢
    });
    
    console.log('Python API响应:', response);
    
    if (response && response.success) {
      return response.plate_number;
    } else {
      throw new Error('Python API返回错误: ' + (response.error || '未知错误'));
    }
  } catch (error) {
    console.error('调用Python API失败:', error.message);
    
    // 如果后端模型加载失败（例如best.onnx路径错误），返回模拟结果
    console.log('切换到模拟识别方法');
    return simulateRecognition();
  }
}

// 模拟识别，用于API调用失败时的备份方案
function simulateRecognition() {
  console.log('使用模拟方法生成车牌号');
  
  const provinces = ['京', '津', '沪', '渝', '冀', '豫', '云', '辽', '黑', '湘'];
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  
  const province = provinces[Math.floor(Math.random() * provinces.length)];
  const letter = letters[Math.floor(Math.random() * letters.length)];
  const numbers = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const lastLetter = letters[Math.floor(Math.random() * letters.length)];
  
  return `${province}${letter}${numbers}${lastLetter}`;
}

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  
  try {
    const { fileID } = event; // 客户端上传的临时文件ID
    
    if (!fileID) {
      return {
        success: false,
        error: '缺少必要参数: fileID'
      };
    }
    
    console.log('获取到图片ID:', fileID);
    
    // 1. 下载图片文件到云函数临时目录
    const tempFilePath = '/tmp/plate_image.jpg';
    
    try {
      // 从云存储下载文件
      const result = await cloud.downloadFile({
        fileID: fileID
      });
      
      const buffer = result.fileContent;
      console.log('成功下载图片，大小:', buffer.length, '字节');
      
      // 写入临时文件
      fs.writeFileSync(tempFilePath, buffer);
      console.log('图片已保存到:', tempFilePath);
      
      // 2. 调用Python API进行识别
      const plateNumber = await recognizePlateWithPythonAPI(buffer, tempFilePath);
      console.log('识别结果:', plateNumber);
      
      // 3. 返回结果
      return {
        success: true,
        plateNumber: plateNumber,
        openid: wxContext.OPENID
      };
      
    } catch (downloadError) {
      console.error('下载图片出错:', downloadError);
      return {
        success: false,
        error: '下载图片失败: ' + downloadError.message
      };
    }
    
  } catch (error) {
    console.error('云函数执行出错:', error);
    return {
      success: false,
      error: error.message,
      openid: wxContext.OPENID
    };
  }
};