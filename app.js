// app.js
App({
  globalData: {
    userInfo: null,
    apiBase: 'http://localhost:8888', // API基础地址
    // 备用API地址列表，按优先级排序
    alternativeApis: [
      'http://127.0.0.1:8888',
      'http://10.14.125.33:8888',
      'http://192.168.2.1:8888',
      'http://172.19.0.1:8888',
      'http://10.0.2.2:8888'  // Android模拟器专用
    ]
  },
  
  onLaunch() {
    // 在启动时执行一些初始化操作
    console.log('App onLaunch');
    
    // 设置全局变量，便于公共模块访问
    const utils = require('./utils/util');
    
    // 建议移除pages/utils目录，统一使用根目录下的utils
    console.log('项目目录结构提示: 建议统一使用根目录下的utils，移除pages/utils');

    // 初始化云函数环境
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloud1', // 替换为您的云环境ID
        traceUser: true
      });
      console.log('云函数环境初始化完成');
    } else {
      console.error('当前微信版本不支持云函数');
    }
    
    // 检查API服务是否可用
    this.checkApiAvailability();
  },
  
  // 检查API服务可用性
  checkApiAvailability() {
    wx.request({
      url: `${this.globalData.apiBase}/health`,
      method: 'GET',
      success: (res) => {
        console.log('API服务健康检查结果:', res.data);
        if (res.data && res.data.status === 'ok') {
          console.log('API服务运行正常，模型已加载状态:', res.data.model_loaded);
        } else {
          console.warn('API服务状态异常:', res.data);
        }
      },
      fail: (err) => {
        console.error('API服务健康检查失败，可能无法进行车牌识别:', err);
        
        // 尝试使用备用IP地址连接
        this.tryAlternativeApiConnection();
      }
    });
  },
  
  // 尝试替代API连接方式
  tryAlternativeApiConnection() {
    console.log('尝试备用API地址连接...');
    this.tryNextApi(0);
  },
  
  // 递归尝试下一个API地址
  tryNextApi(index) {
    if (index >= this.globalData.alternativeApis.length) {
      console.error('所有API地址均连接失败');
      wx.showToast({
        title: '无法连接到服务器',
        icon: 'none',
        duration: 3000
      });
      return;
    }
    
    const apiUrl = this.globalData.alternativeApis[index];
    console.log(`尝试连接备用API(${index+1}/${this.globalData.alternativeApis.length}):`, apiUrl);
    
    wx.request({
      url: `${apiUrl}/health`,
      method: 'GET',
      success: (res) => {
        console.log('备用API连接成功:', res.data);
        // 更新API基础地址
        this.globalData.apiBase = apiUrl;
        wx.showToast({
          title: '已连接到服务器',
          icon: 'success',
          duration: 2000
        });
      },
      fail: (err) => {
        console.error(`备用API(${apiUrl})连接失败:`, err);
        // 尝试下一个地址
        this.tryNextApi(index + 1);
      }
    });
  },
  
  // 全局用户信息更新
  updateUserInfo(userInfo) {
    this.globalData.userInfo = userInfo;
  }
})
