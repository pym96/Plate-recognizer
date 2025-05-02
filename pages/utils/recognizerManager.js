const mockRecognizer = require('./mockRecognizer');
const onnxRecognizer = require('./onnxRecognizer');
const cloudRecognizer = require('./cloudRecognizer');
const apiRecognizer = require('./apiRecognizer');

// 识别器管理器，用于选择合适的识别器
const recognizerManager = {
  // 识别器列表
  recognizers: {
    mock: mockRecognizer,
    onnx: onnxRecognizer,
    cloud: cloudRecognizer,
    api: apiRecognizer
  },
  
  // 当前使用的识别器类型: 'mock', 'onnx', 'cloud', 'api'
  // 默认使用Python API识别器
  currentRecognizerType: 'api',
  
  // 获取当前识别器
  getCurrentRecognizer: function() {
    return this.recognizers[this.currentRecognizerType];
  },
  
  // 切换识别器类型
  setRecognizerType: function(type) {
    if (this.recognizers[type]) {
      this.currentRecognizerType = type;
      console.log(`已切换识别器类型为: ${type}`);
      return true;
    } else {
      console.error(`不支持的识别器类型: ${type}`);
      return false;
    }
  },
  
  // 识别车牌
  recognizePlate: function(imagePath) {
    const recognizer = this.getCurrentRecognizer();
    console.log(`使用 ${this.currentRecognizerType} 识别器进行车牌识别`);
    return recognizer.recognizePlate(imagePath);
  }
};

module.exports = recognizerManager; 