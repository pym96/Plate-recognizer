#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
车牌字符集定义文件
"""

# 车牌字符集（含省份、字母、数字和特殊字符）
plate_chr = ["京", "沪", "津", "渝", "冀", "晋", "蒙", "辽", "吉", "黑", "苏", "浙", "皖", "闽", "赣", "鲁", "豫", "鄂", "湘", "粤", "桂",
             "琼", "川", "贵", "云", "藏", "陕", "甘", "青", "宁", "新", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A",
             "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "P", "Q", "R", "S", "T", "U", "V", "W", "X",
             "Y", "Z", "港", "学", "使", "警", "澳", "挂", "军", "北", "南", "广", "沈", "兰", "成", "济", "海", "民", "航", "空",
             "-"]

class strLabelConverter(object):
    """
    将标签字符串转换为可训练的索引表示形式
    """
    def __init__(self, alphabet):
        self.alphabet = alphabet
        self.dict = {}
        for i, char in enumerate(alphabet):
            # 注意: 0 是reserved for 'blank' required by CTC
            self.dict[char] = i + 1

    def encode(self, text):
        """
        支持批量文本
        文本到索引的转换
        """
        if isinstance(text, str):
            text = [self.dict[char] for char in text]
            length = [len(text)]
        else:
            length = [len(s) for s in text]
            text = ''.join(text)
            text = [self.dict[char] for char in text]
        return (text, length)

    def decode(self, t, length=None, raw=False):
        """
        索引到文本的转换 - 简化版本，不需要torch
        """
        # 简化版本只处理单个序列
        if raw:
            return ''.join([self.alphabet[i - 1] if i > 0 and i <= len(self.alphabet) else '' for i in t])
        else:
            char_list = []
            prev_char = -1
            for i in t:
                if i != 0 and i != prev_char:  # 检查是否是blank和重复
                    if i - 1 < len(self.alphabet):  # 确保索引有效
                        char_list.append(self.alphabet[i - 1])
                prev_char = i
            return ''.join(char_list) 