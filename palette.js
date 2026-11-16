// Silver highlights and graphite shadows form a continuous chrome surface.
export const palette = ['#999999', '#dddddd', '#aaaaaa', '#eeeeee', '#888888', '#cccccc', '#999999', '#ffffff', '#999999', '#eeeeee'];
const channels = palette.map(hex => [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16)));

export function paletteColour(index, time = 0) {
  const phase = index + time / 4500;
  const position = Math.floor(phase);
  const from = channels[((position % channels.length) + channels.length) % channels.length];
  const to = channels[((position + 1) % channels.length + channels.length) % channels.length];
  const blend = phase - position;
  return `rgb(${from.map((value, channel) => Math.round(value + (to[channel] - value) * blend)).join(',')})`;
}
