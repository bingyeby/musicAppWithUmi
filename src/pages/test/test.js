import {connect} from 'dva';
import styles from './test.less';
import React from 'react'
import _ from 'lodash'
import DTitle from 'react-document-title'
import index from "@/pages/index";

@connect((state) => {
  return {
    example: state.example,
    ...state.music,
  }
})
class Page extends React.Component {


  constructor(props) {
    super(props)
    this.state = {}
  }


  componentDidMount() {
    this.audio = this.refs.audio
    this.audio.play()

    this.audio.addEventListener("timeupdate", () => {
      this.assignS('playInfo', {currentTime: this.audio.currentTime, duration: this.audio.duration})

    });

    this.audio.addEventListener("ended", () => {
      this.nextPlay()
    }, false);

    this.canvasDraw()

  }

  componentDidUpdate() {
    if (this.props.playInfo.playStatus) {
      this.audio.play()
    } else {
      this.audio.pause();
    }
  }

  updateS = (moduleName, data) => {
    this.props.dispatch({
      type: 'music/updateState',
      payload: {
        moduleName,
        data,
      },
    })
  }

  assignS = (moduleName, data) => {
    this.props.dispatch({
      type: 'music/assignState',
      payload: {
        moduleName,
        data,
      },
    })
  }


  canvasDraw = (n, i) => {
    // https://www.cnblogs.com/Wayou/p/3543577.html
    let audioContext = new AudioContext(); //创建一个音乐对象
    // 创建获取频谱能量值的analyser节点
    let analyser = audioContext.createAnalyser();
    //创建音乐媒体源节点
    let audioSrc = audioContext.createMediaElementSource(this.audio);
    //将媒体源节点与分析机制链接
    audioSrc.connect(analyser);
    //将分析机制与目标点链接（扬声器）
    analyser.connect(audioContext.destination);


    let can = this.refs.canvasVoice;
    let cxt = can.getContext("2d");
    let color = cxt.createLinearGradient(can.width * 0.5, 0, can.width * 0.5, 150);
    color.addColorStop(0, "#00d1ff");
    color.addColorStop(0.5, "#0095ff");
    color.addColorStop(1, "#0065ff");
    let colorf = cxt.createLinearGradient(can.width * .5, 150, can.width * .5, 250);
    colorf.addColorStop(0, "#00d1ff");
    colorf.addColorStop(0.5, "#0095ff");
    colorf.addColorStop(1, "#0065ff");
    draw();

    function draw() {
      //创建一个与音乐频次等长的数组 【自动转换为0-255之间的数子】 analyser.frequencyBinCount 1024
      let byteData = new Uint8Array(analyser.frequencyBinCount);
      //将分析出来的音频数据添加到数组里面
      analyser.getByteFrequencyData(byteData);


      cxt.clearRect(0, 0, can.width, can.height);

      cxt.globalAlpha = 0.3;//透明度
      cxt.beginPath();

      let num = 1000;// 抽样数
      let step = Math.round(byteData.length / num);// 步长
      let stepWith = 0.3
      for (let i = 0; i < num; i++) {
        let value = (byteData[step * i]) / 2;
        cxt.fillStyle = color;
        cxt.fillRect(i * stepWith + can.width * 0.49, 150, 10, -value + 1);// 0.49 0.51 用以错位
        cxt.fillRect(can.width * 0.51 - (i - 1) * stepWith, 150, -10, -value + 1);
        cxt.fillStyle = colorf;
        cxt.fillRect(i * stepWith + can.width * 0.49, 150, 10, value * 0.6 + 1);
        cxt.fillRect(can.width * 0.51 - (i - 1) * stepWith, 150, -10, value * 0.6 + 1);
      }
      cxt.closePath();
      requestAnimationFrame(draw);
    }
  }

  volumeSizeMouseUp = (e) => {
    this.mouseInMark = false
    this.mouseDownInfo = null
  }

  volumeSizeMouseMove = (e) => {
    let originX = this.refs.volumeSize.getBoundingClientRect().x
    let originWith = this.refs.volumeSize.getBoundingClientRect().width
    if (this.mouseInMark) {
      let currentTime = ((e.clientX - originX) / originWith) * this.props.playInfo.songTime
      this.updateS('playInfo.songTimeCurrent', currentTime)
    }
  }

  volumeSizeClick = (e) => {
    let originX = this.refs.volumeSize.getBoundingClientRect().x
    let originWith = this.refs.volumeSize.getBoundingClientRect().width
    let currentTime = ((e.clientX - originX) / originWith) * this.props.playInfo.songTime
    this.updateS('playInfo.songTimeCurrent', currentTime)
  }

  volumeCurrentMarkMouseDown = (e) => {
    this.mouseInMark = true
    this.mouseDownInfo = {
      x: e.clientX
    }
  }

  volumeCurrentMarkMouseUp = (e) => {
    this.mouseInMark = false
    this.mouseDownInfo = null
  }


  /*
  * 播放列表中上一个
  * */
  prePlay = _.throttle(() => {
    let index = _.findIndex(this.props.defaultList, {active: true})
    if (index === 0) {
      index = _.size(this.props.defaultList) - 1
    } else {
      index--
    }
    _.each(this.props.defaultList, (n, i) => {
      n.active = false
    })
    this.props.defaultList[index].active = true
    this.updateS('defaultList', this.props.defaultList)
    this.updateS('playInfo', {
      currentTime: 0,
      duration: 0,
      playStatus: true,
      ...this.props.defaultList[index]
    })
  }, 800)
  /*
  * 播放列表中下一个
  * */
  nextPlay = _.throttle(() => {
    let index = _.findIndex(this.props.defaultList, {active: true})
    if (index === _.size(this.props.defaultList) - 1) {
      index = 0
    } else {
      index++
    }
    _.each(this.props.defaultList, (n, i) => {
      n.active = false
    })
    this.props.defaultList[index].active = true
    this.updateS('defaultList', this.props.defaultList)
    this.updateS('playInfo', {
      currentTime: 0,
      duration: 0,
      playStatus: true,
      ...this.props.defaultList[index]
    })
  }, 800)
  /*
  * 播放列表中的某个被点击歌曲
  * */
  defaultLiClick = (index) => {
    _.each(this.props.defaultList, (n, i) => {
      n.active = false
    })
    this.props.defaultList[index].active = true
    this.updateS('defaultList', this.props.defaultList)
    this.updateS('playInfo', {
      currentTime: 0,
      duration: 0,
      playStatus: true,
      ...this.props.defaultList[index]
    })
  }

  /*
  * 时间格式化  将秒单位的时间数格式化为:'02:03'
  * */
  timeFormat = (time) => {
    if (time === 0 || _.isNaN(time)) {
      return '00:00'
    }
    return `${Math.floor(time / 60)}`.padStart(2, '0') + ':' + `${Math.floor(time % 60)}`.padStart(2, '0')
  }


  lrcWrapRightMouseDown = (e) => {
    this.lrcWrapRightMouseMoving = true

  }
  lrcWrapRightMouseMove = (e) => {
    if (this.lrcWrapRightMouseMoving) {

    }
  }
  lrcWrapRightMouseUp = (e) => {
    this.lrcWrapRightMouseMoving = false
    this.lrcWrapRightMouseMovingBeginInfo = {
      y: e.clientY
    }
  }


  /*
  * 将lrc格式化输出
  * {time:'11',value:'我有花一朵'}
  * */
  formatLrc = (lrcStr) => {
    return lrcStr.split(/\[/gi).map((n, i) => {
      let timeValueArr = n.split(/\]/) // ['00:11.53', '我有花一朵']
      if (timeValueArr.length === 2 && /^\d{2}\:\d{2}\.\d{2}$/.test(timeValueArr[0])) {
        let timeArr = timeValueArr[0].split(".")[0].split(":");
        return {
          time: timeArr[0] * 60 + timeArr[1] * 1,
          value: timeValueArr[1]
        }
      } else {
        return null
      }
    }).filter((n, i) => {
      return n
    })
  }

  render() {
    console.log(`this.props`, this.props);
    let playInfo = this.props.playInfo
    let formatLrcObj = this.formatLrc(playInfo.lrc)

    let lrcCurrentIndex = _.sortedIndex(_.map(formatLrcObj, 'time'), playInfo.currentTime * 1)


    return (
      <DTitle title='My Music App' className={styles.normal}>
        <div className={styles.outer}>
          <div className={styles.inner}>
            <div className={styles.header}>
              <div className={styles.title}>音乐小屋</div>
              <div className={styles.search}>
                <input type="text" placeholder="请输入要搜索的歌曲..." id="searchInput"/>
                <a href="javascript:void(0)" title="搜索" id="search" className="iconfont ic"/>
              </div>
              <div className={styles.close}>X</div>
            </div>
            <div className={styles.musicBody}>
              <div className={styles.left}>
                <div className={styles.defaultList}>
                  {
                    _.map(this.props.defaultList, (n, i) => {
                      return <span key={i} className={n.active ? styles.active : ''}
                                   onClick={this.defaultLiClick.bind(this, i)}>{n.name}</span>
                    })
                  }
                </div>
              </div>
              <div className={styles.right} onMouseMove={this.lrcWrapRightMouseMove} onMouseUp={this.lrcWrapRightMouseUp} onMouseDown={this.lrcWrapRightMouseDown}>
                <canvas ref="canvasVoice" className="canvas" width="600" height="300"></canvas>
                <div className={styles.lrcWrap} style={{transform: `translate(0,${-100 * lrcCurrentIndex / _.size(formatLrcObj)}%)`}}>
                  {
                    _.map(formatLrcObj, (n, i) => {
                      return <div key={i} style={lrcCurrentIndex - 1 === i ? {
                        fontSize: 18,
                        fontWeight: 'bolder'
                      } : {}}>{n.value}</div>
                    })
                  }
                </div>

              </div>
            </div>
            <div className={styles.footer}>
              <div className={styles.playOpt}>
                <div onClick={this.prePlay}>上</div>
                <div onClick={(e) => {
                  this.updateS('playInfo.playStatus', !this.props.playInfo.playStatus)
                }}>中
                </div>
                <div onClick={this.nextPlay}>下</div>
              </div>
              <div className={styles.songMiniBill}>小海报</div>
              <div className={styles.volumeSwitch}>静音与否</div>
              <div className={styles.volumeSize} ref={'volumeSize'}
                   onMouseMove={this.volumeSizeMouseMove} onMouseUp={this.volumeSizeMouseUp} onClick={this.volumeSizeClick}>
                {/*标志线*/}
                <div className={styles.volumeCurrent} style={{width: `${100 * playInfo.currentTime / playInfo.duration}%`}}></div>
                {/*操作按钮*/}
                <div className={styles.volumeCurrentMark} style={{left: `${100 * playInfo.currentTime / playInfo.duration}%`}}
                     onMouseUp={this.volumeCurrentMarkMouseUp} onMouseDown={this.volumeCurrentMarkMouseDown}>
                </div>

                <div className={styles.songNameMini}>{playInfo.name}</div>
                <div className={styles.time}>{this.timeFormat(playInfo.currentTime)}/{this.timeFormat(playInfo.duration)}</div>
              </div>
              <div className={styles.collect}>收藏</div>

            </div>
            <audio ref="audio" src={this.props.playInfo.src} ossorigin="anonymous"></audio>
          </div>
        </div>
      </DTitle>
    )
  } ;
}

export default Page
