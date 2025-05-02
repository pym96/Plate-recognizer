// mockRecognizer.js
// 用于模拟车牌识别功能，用于开发和测试阶段

// 模拟车牌识别器
const mockRecognizer = {
  // 模拟识别车牌
  recognizePlate: function(imagePath) {
    return new Promise((resolve, reject) => {
      console.log('mockRecognizer: 开始模拟识别图片:', imagePath);
      
      // 随机等待一段时间，模拟网络延迟
      setTimeout(() => {
        try {
          // 模拟随机车牌
          const provinces = ['京', '津', '沪', '渝', '冀', '豫', '云', '辽', '黑', '湘'];
          const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
          const province = provinces[Math.floor(Math.random() * provinces.length)];
          const letter = letters[Math.floor(Math.random() * letters.length)];
          const numbers = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
          const lastLetter = letters[Math.floor(Math.random() * letters.length)];
          
          const plateNumber = `${province}${letter}${numbers}${lastLetter}`;
          
          console.log('mockRecognizer: 模拟识别结果:', plateNumber);
          
          resolve(plateNumber);
        } catch (err) {
          console.error('mockRecognizer: 模拟识别出错:', err);
          reject(err);
        }
      }, 800);  // 随机延迟800毫秒
    });
  }
};

module.exports = mockRecognizer; 