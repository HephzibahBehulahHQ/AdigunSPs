export function appendTrendSample(history, tag, sample, retention = 60) {
  const limit = Math.max(1, Math.min(10000, Math.floor(Number(retention) || 60)));
  history[tag] = [...(history[tag] || []), { time:Number(sample.time) || Date.now(), value:Number(sample.value) || 0 }].slice(-limit);
  return history[tag];
}

export function trimTrendHistory(history, retention = 60) {
  const limit = Math.max(1, Math.min(10000, Math.floor(Number(retention) || 60)));
  for (const samples of Object.values(history)) if (samples.length > limit) samples.splice(0, samples.length - limit);
  return history;
}

export function trendSampleHeights(samples) {
  if (!samples?.length) return [];
  const values = samples.map((sample) => Number(sample.value) || 0), min = Math.min(...values), max = Math.max(...values);
  return values.map((value) => max === min ? 50 : Math.max(2, Math.min(100, 2 + ((value - min) / (max - min)) * 98)));
}
