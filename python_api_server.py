#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
车牌识别API服务器示例
用于微信小程序车牌识别项目的本地开发测试
"""

import os
import sys
import time
import json
import base64
import logging
import numpy as np
import cv2
from io import BytesIO
from datetime import datetime
from PIL import Image

# 导入Web服务相关库
from flask import Flask, request, jsonify
from flask_cors import CORS

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 创建Flask应用
app = Flask(__name__)
CORS(app)  # 允许跨域请求，开发阶段需要

# 导入ONNX运行时
import onnxruntime as ort

# 定义车牌字符集 - 直接从alphabets.py导入，确保完全一致
plate_chr1 = ['#', '京', '沪', '津', '渝', '冀', '晋', '蒙', '辽', '吉', '黑', '苏', '浙', '皖', '闽', '赣', '鲁', '豫', '鄂', '湘', '粤', '桂', '琼', '川', '贵', '云', '藏', '陕', '甘', '青', '宁', '新', '学', '警', '港', '澳', '挂', '使', '领', '民', '航', '危', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '险', '品']
plate_chr="#京沪津渝冀晋蒙辽吉黑苏浙皖闽赣鲁豫鄂湘粤桂琼川贵云藏陕甘青宁新学警港澳挂使领民航危0123456789ABCDEFGHJKLMNPQRSTUVWXYZ险品"

# 直接从onnx_infer.py复制的预处理参数
mean_value, std_value = (0.588, 0.193)  # 识别模型均值标准差

# 直接从onnx_infer.py复制的解码函数
def decodePlate(preds):  # 识别后处理
    pre = 0
    newPreds = []
    for i in range(len(preds)):
        if preds[i] != 0 and preds[i] != pre:
            newPreds.append(preds[i])
        pre = preds[i]
    plate = ""
    for i in newPreds:
        plate += plate_chr1[int(i)]
    return plate

# 直接从onnx_infer.py复制的预处理函数
def rec_pre_processing(img_data):
    """
    完全复制onnx_infer.py中的rec_pre_precessing函数逻辑
    """
    # 从二进制数据加载图像
    nparr = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("无法解码图像数据")
    
    # 检查是否是RGBA图像，转换为RGB
    if img.shape[-1] == 4:
        img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
    
    # 调整大小到模型输入尺寸 - 与rec_pre_precessing完全一致
    img = cv2.resize(img, (168, 48))
    
    # 标准化 - 完全按照rec_pre_precessing
    img = img.astype(np.float32)
    img = (img / 255.0 - mean_value) / std_value
    
    # 转换为CHW格式并添加批次维度
    img = img.transpose(2, 0, 1)  # 从HWC转为CHW
    img = img.reshape(1, *img.shape)  # 添加批次维度
    
    logger.info(f"Input shape after preprocessing: {img.shape}")  # 添加调试输出
    return img

# 导入从onnx_infer.py复制get_plate_result函数的逻辑
def get_plate_result(img_data, session):
    """
    完全复制onnx_infer.py中的get_plate_result函数，添加更多调试输出
    """
    # 预处理图像
    img = rec_pre_processing(img_data)
    
    # 运行推理
    input_name = session.get_inputs()[0].name
    output_name = session.get_outputs()[0].name
    y_onnx = session.run([output_name], {input_name: img})[0]
    
    # 输出原始的模型输出形状和前几个数值用于调试
    logger.info(f"模型输出shape: {y_onnx.shape}")
    logger.info(f"模型输出前5个样本形状: {y_onnx[0][:5].shape}")
    
    # 输出原始网络输出的前几个值
    logger.info(f"原始网络输出(一小部分): {y_onnx[0][0][:10]}")
    
    # 获取最大概率索引
    index = np.argmax(y_onnx[0], axis=1)
    
    # 输出最大概率值
    max_values = np.max(y_onnx[0], axis=1)
    logger.info(f"最大概率值(前10个): {max_values[:10]}")
    
    # 调试输出原始索引
    logger.info(f"原始预测索引: {index}")
    
    # 输出更详细的信息
    logger.info(f"索引含义: {[plate_chr[int(i)] if i < len(plate_chr) else '?' for i in index]}")
    
    # 解码前的中间步骤
    pre = 0
    newPreds = []
    for i in range(len(index)):
        if index[i] != 0 and index[i] != pre:
            newPreds.append(index[i])
        pre = index[i]
    
    logger.info(f"去重后的索引: {newPreds}")
    logger.info(f"去重后的含义: {[plate_chr[int(i)] if i < len(plate_chr) else '?' for i in newPreds]}")
    
    # 解码车牌
    plate_no = decodePlate(index)
    
    return plate_no

# 车牌识别类 - 完全使用onnx_infer.py的处理流程
class LicensePlateRecognizer:
    def __init__(self, model_path):
        logger.info(f"加载ONNX模型: {model_path}")
        
        # 初始化ONNX运行时会话 - 与onnx_infer.py保持一致
        providers = ['CPUExecutionProvider']
        self.session = ort.InferenceSession(model_path, providers=providers)
        
        # 记录输入输出名称
        self.input_name = self.session.get_inputs()[0].name
        self.output_name = self.session.get_outputs()[0].name
        logger.info(f"模型输入名称: {self.input_name}")
        logger.info(f"模型输出名称: {self.output_name}")
        
        logger.info("模型初始化完成")

    def recognize(self, image_data):
        try:
            # 直接传递 bytes 数据给 get_plate_result
            plate_no = get_plate_result(image_data, self.session)
            return plate_no
        except Exception as e:
            logger.error(f"识别过程中出错: {str(e)}")
            raise

# 加载模型
def load_model():
    try:
        model_path = os.path.abspath('/Users/panyiming/WeChatProjects/miniprogram-2/assets/best.onnx')
        logger.info(f"尝试加载模型，完整路径: {model_path}")
        
        # 检查文件是否存在
        if not os.path.exists(model_path):
            logger.error(f"模型文件不存在: {model_path}")
            return None
            
        recognizer = LicensePlateRecognizer(model_path)
        return recognizer
    except Exception as e:
        logger.error(f"加载模型失败: {str(e)}")
        return None

# 初始化模型
model = load_model()

@app.route('/recognize_plate', methods=['POST'])
def recognize_plate():
    """车牌识别API端点"""
    try:
        start_time = time.time()
        data = request.json
        
        if not data or 'image' not in data:
            return jsonify({
                'success': False,
                'error': '缺少图像数据'
            })
        
        # 解码Base64图像
        try:
            image_data = base64.b64decode(data['image'])
            logger.info(f"收到图像数据，大小: {len(image_data)} 字节")
            
            # 保存图像用于调试（可选）
            debug_dir = "debug_images"
            if not os.path.exists(debug_dir):
                os.makedirs(debug_dir)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
            debug_path = os.path.join(debug_dir, f"plate_{timestamp}.jpg")
            with open(debug_path, "wb") as f:
                f.write(image_data)
            logger.info(f"图像已保存到: {debug_path}")
            
            # 车牌识别
            if model is not None:
                try:
                    plate_number = model.recognize(image_data)  # 直接传递 bytes 数据
                    process_time = time.time() - start_time
                    logger.info(f"识别结果: {plate_number}, 耗时: {process_time:.2f}秒")
                    
                    return jsonify({
                        'success': True,
                        'plate_number': plate_number,
                        'process_time': process_time
                    })
                except Exception as e:
                    logger.error(f"模型推理错误: {str(e)}")
                    # 在模型推理失败时使用模拟结果
                    plate_number = generate_mock_plate()
                    return jsonify({
                        'success': True,
                        'plate_number': plate_number,
                        'process_time': time.time() - start_time,
                        'note': '使用模拟结果'
                    })
            else:
                # 模型加载失败时使用模拟结果
                plate_number = generate_mock_plate()
                logger.info(f"使用模拟结果: {plate_number}")
                return jsonify({
                    'success': True,
                    'plate_number': plate_number,
                    'process_time': time.time() - start_time,
                    'note': '使用模拟结果'
                })
            
        except Exception as e:
            logger.error(f"图像处理错误: {str(e)}")
            return jsonify({
                'success': False,
                'error': f'图像处理错误: {str(e)}'
            })
            
    except Exception as e:
        logger.error(f"API错误: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'API错误: {str(e)}'
        })

# 生成模拟车牌号
def generate_mock_plate():
    import random
    provinces = ["京", "津", "沪", "渝", "冀", "豫", "云", "辽", "黑", "湘"]
    letters = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]
    province = random.choice(provinces)
    letter = random.choice(letters)
    numbers = f"{random.randint(0, 9999):04d}"
    last_letter = random.choice(letters)
    return f"{province}{letter}{numbers}{last_letter}"

@app.route('/health', methods=['GET'])
def health_check():
    """健康检查API"""
    return jsonify({
        'status': 'ok',
        'model_loaded': model is not None,
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8888))  # 修改默认端口为8888，避免与其他进程冲突
    logger.info(f"启动车牌识别API服务器，端口: {port}")
    logger.info("注意: 这是一个开发服务器，不建议用于生产环境")
    app.run(host='0.0.0.0', port=port, debug=True)