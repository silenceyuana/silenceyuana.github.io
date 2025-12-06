// source/js/runtime.js
setInterval(() => {
  let create_time = Math.round(new Date('2025-12-06 00:00:00').getTime() / 1000); // 修改建站时间
  let timestamp = Math.round((new Date().getTime()) / 1000);
  let second = timestamp - create_time;
  let time = new Array(0, 0, 0, 0, 0);

  var daily = 60 * 60 * 24;
  var hourly = 60 * 60;
  var minute = 60;

  if (second >= daily) {
    time[0] = parseInt(second / daily);
    second %= daily;
  }
  if (second >= hourly) {
    time[1] = parseInt(second / hourly);
    second %= hourly;
  }
  if (second >= minute) {
    time[2] = parseInt(second / minute);
    second %= minute;
  }
  time[3] = second;

  // 这里的 workboard 对应上面配置文件里写的 id
  let runtimeContainer = document.getElementById("workboard");
  if (runtimeContainer) {
    runtimeContainer.innerHTML = "本站已运行: " + time[0] + " 天 " + time[1] + " 小时 " + time[2] + " 分 " + time[3] + " 秒";
  }
}, 1000);