/**
 * cn — classNames 合并工具函数
 *
 * 设计原理：将 clsx（条件 class 合并）和 tailwind-merge（Tailwind class 冲突消除）组合，
 * 确保组件传入的 className 能正确覆盖默认样式。
 *
 * @param inputs - 任意数量的 class 值（字符串、对象、数组）
 * @returns 合并去重后的 class 字符串
 *
 * @example
 * cn('px-4 py-2', props.className, isActive && 'bg-blue-500')
 */
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
