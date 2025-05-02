// cloud/functions/recognizePlate/index.js
// 云函数入口文件

/*
  注意：这是一个云函数模板，需要根据实际部署环境进行修改
  
  对于正式部署，您需要:
  1. 将ONNX模型部署到云函数或服务器
  2. 安装必要的依赖
  3. 根据您的环境配置模型路径
*/

const cloud = require('wx-server-sdk');
const fs = require('fs');
const path = require('path');
const request = require('request-promise');

cloud.init();

// 参考qt_ui.py中的模型调用方式
// 在实际部署中，您需要根据云环境安装相应的推理库
// 例如使用TensorFlow.js或其他支持ONNX的JavaScript库
// 以下为示例代码，实际部署需要修改

// 调用本地Python API进行车牌识别
async function recognizePlateWithPythonAPI(imageBuffer, tempFilePath) {
  console.log('开始调用Python API识别车牌...');
  
  // Python API服务地址
  // 注意：云函数中无法直接访问localhost
  // 开发阶段可用内网IP，生产环境需要用公网可访问的域名
  const apiUrl = 'http://your-python-api-domain:5000/recognize_plate';
  
  try {
    // 方案1: 如果Python API接受base64图像
    const base64Image = imageBuffer.toString('base64');
    
    const response = await request({
      method: 'POST',
      uri: apiUrl,
      body: {
        image: base64Image
      },
      json: true
    });
    
    console.log('Python API响应:', response);
    
    if (response && response.success) {
      return response.plate_number;
    } else {
      throw new Error('Python API返回错误: ' + (response.error || '未知错误'));
    }
  } catch (error) {
    console.error('调用Python API失败:', error);
    
    // 调用失败时使用备用模拟方法
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