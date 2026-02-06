/**
 * 将分钟数转换为更大的时间单位（小时、天、周）
 * @param {number} minutes - 分钟数
 * @returns {Object} 包含转换后数值和单位的对象
 */
export function convertMinutesToLargestUnit(minutes) {
  if (typeof minutes !== 'number' || minutes <= 0) {
    return { value: 0, unit: '分钟' };
  }

  const minute = 1;
  const hour = 60;
  const day = 24 * hour;
  const week = 7 * day;

  if (minutes >= week && minutes % week === 0) {
    return { value: Math.floor(minutes / week), unit: '周' };
  } else if (minutes >= day && minutes % day === 0) {
    return { value: Math.floor(minutes / day), unit: '天' };
  } else if (minutes >= hour && minutes % hour === 0) {
    return { value: Math.floor(minutes / hour), unit: '小时' };
  } else {
    return { value: minutes, unit: '分钟' };
  }
}

/**
 * 将分钟数转换为合适的时间单位表示
 * @param {number} minutes - 分钟数
 * @returns {string} 格式化的时间字符串
 */
export function formatTimeFromMinutes(minutes) {
  const { value, unit } = convertMinutesToLargestUnit(minutes);
  return `${value} ${unit}`;
}