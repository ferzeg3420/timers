import "./style.css";

import * as React from "react";
import { render } from "react-dom";

const gongURL = "https://assets.codepen.io/5324539/MUSCPerc_Cymbale+ride+20+6+%28ID+2328%29_BSB.wav";

let synth = window.speechSynthesis;

var timerColors = [
  {
    color: "#173F5F",
    timerId: "0",
    isBeingUsed: true,
  },
  {
    color: "#20639B",
    timerId: "",
    isBeingUsed: false,
  },
  {
    color: "#3CAEA3",
    timerId: "",
    isBeingUsed: false,
  },
  {
    color: "#ffa81e",
    timerId: "",
    isBeingUsed: false,
  },
  {
    color: "#ED553B",
    timerId: "",
    isBeingUsed: false,
  },
  {
    color: "#4b3e4d",
    timerId: "",
    isBeingUsed: false,
  },
];

//localStorage.clear();

const localStorageError = localStorage.getItem('localStorageError');
console.log("localstorege error:", localStorageError);
if( localStorageError === null ) {
  localStorage.setItem('localStorageError', "true");
}
else if( localStorageError === "true" ) {
  console.log("recover from badness");
  //set savedTimers to null.
  localStorage.setItem('savedTimers', "");
}
else {
  const savedColors = localStorage.getItem('savedColors');
  console.log("ping");
  console.log("savedColors:", JSON.parse(savedColors));
  if( savedColors !== null ) {
    console.log("ping");
    timerColors = JSON.parse(savedColors);
  }
}

function findOrder(timerId, orders) {
  if( orders.length === 0) {
    return {order: 98};
  }
  for( let ord of orders ) {
    if( ord.timerId === timerId ) {
      return {order: ord.order};
    }
  }
  return {order: 98};
}

function beep(message) {
  document.getElementById('beep').pause();
  document.getElementById('beep').play();
  
  var utterThis = new SpeechSynthesisUtterance(message);
  synth.speak(utterThis);
}

function addLeadingZero(timeString) {
  if (timeString.length < 2) {
    return "0" + timeString;
  } 
  else {
    return timeString;
  }
}

function findTimerColor(timerId) {
  const fallbackColor = "royalBlue";
  for( let item of timerColors ) {
    if( !item.isBeingUsed ) {
      item.timerId = timerId.toString();
      item.isBeingUsed = true;
      return item.color;
    }
  }
  return fallbackColor;
}

function freeTimerColor(timerId) {
  for( let item of timerColors ) {
    if( item.timerId === timerId ) {
      item.timerId = "";
      item.isBeingUsed = false;
      break;
    }
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      nextTimerId: 1,
      orders: [],
      timers: [
        {
          savedOrder: "",
          timerId: 0,
          isRunning: false,
          color: "#173F5F",
          progress: 0,
          alarmMessage: '',
          runningTimeMinutes: "01",
          runningTimeSeconds: "00",
          originalTime: 1
        }
      ],
    }
    this.updateTimerWidths = this.updateTimerWidths.bind(this);
    this.componentCleanup = this.componentCleanup.bind(this);
    this.handleMessageChange = this.handleMessageChange.bind(this);
    this.updateTimer = this.updateTimer.bind(this);
    this.resetHandler = this.resetHandler.bind(this);
    this.toggleStartStop = this.toggleStartStop.bind(this);
    this.increaseTogglerHandler = this.increaseTogglerHandler.bind(this);
    this.decreaseTogglerHandler = this.decreaseTogglerHandler.bind(this);
    this.addTimer = this.addTimer.bind(this);
    this.deleteTimer = this.deleteTimer.bind(this);
    this.handleClickOnGrip = this.handleClickOnGrip.bind(this);
    this.handleMouseEnterAlarm = this.handleMouseEnterAlarm.bind(this);
  }  
  
  componentDidMount() {
    setInterval(this.updateTimer, 1000);
    window.addEventListener('resize', this.updateTimerWidths);
    //load the timers here.
    const savedTimers = localStorage.getItem('savedTimers');
    const savedOrders = localStorage.getItem('savedOrders');
    console.log("savedTimers:", JSON.parse(savedTimers));
    window.addEventListener('beforeunload', this.componentCleanup);
    if( savedOrders !== null ) {
      this.state.orders = JSON.parse(savedTimers);
    }
    if( savedTimers !== null && savedTimers !== "" ) {
      console.log("setting savedTimers:", JSON.parse(savedTimers));
      this.setState({timers: JSON.parse(savedTimers)}, () => {
        this.state.nextTimerId = this.state.timers.length;
        for(let timer of this.state.timers) {
          console.log("updating order", timer.timerId);
          let socket = document.getElementById(timer.timerId).parentElement;
          socket.style.order = timer.savedOrder;
        }
      });
    }
  }
  
  componentWillUnmount() {
    console.log("unmount");
    this.componentCleanup();
    window.removeEventListener('beforeunload', this.componentCleanup);
    window.removeEventListener('resize', this.updateTimerWidths);
  }
  
  componentCleanup() {
    console.log("unmounting");
    const timersToSave = [...this.state.timers];
    const colorsToSave = [...timerColors];
    let newIndex = 0;
    for( let timer of timersToSave ) {
      const socket = document.getElementById(timer.timerId).parentElement;
      timer.savedOrder = socket.style.order;
      for(let color of colorsToSave) {
        if(color.timerId === (timer.timerId).toString()) {
          color.timerId = (newIndex).toString();
        }
      }
      timer.timerId = newIndex;
      newIndex++; // Not in the last line just cause I don't trust JS lol.
    }
    localStorage.setItem('savedTimers', JSON.stringify(timersToSave));
    localStorage.setItem('savedColors', JSON.stringify(colorsToSave));
    localStorage.setItem('savedOrders', JSON.stringify(this.state.orders));
    localStorage.setItem('localStorageError', "false");
    console.log("unmounted");
  }
  
  updateTimerWidths() {
    console.log("updateTimerWidths!");
    this.state.timers.map((item) => {
      console.log("timer id:", item.timerId);
      let elem = document.getElementById(item.timerId);
      let paren = elem.parentElement;
      let parenRect = paren.getBoundingClientRect();
      elem.style.width = (parenRect.right - parenRect.left) + "px";
   });
  }
  
  handleMessageChange(event, timerId) {
    this.setState( state => {
      const timers = this.state.timers.map((item) => {
        if (item.timerId === parseInt(timerId)) {
          const newItem = item;
          newItem.alarmMessage = event.target.value;
          return newItem;
        }
        else {
          return item;
        }
      });
      return {
        timers,
      };
    });
  }
  
  /* Decreases the running time by one */
  updateTimer() {    
    this.state.timers.map( (iter) => 
    {
      if (iter === undefined || (! iter.isRunning)) {
        return;
      }
    
      const origTime = parseInt(iter.originalTime) * 60;
      const currentTime = (parseInt(iter.runningTimeMinutes) * 60) + parseInt(iter.runningTimeSeconds);
      const timeRan = origTime - currentTime;
      const percentage = (timeRan / origTime) * 100 + 0.5;
      iter.progress = percentage;
      if (currentTime === 0) {
        const messageBeep = iter.alarmMessage;
        beep(messageBeep);
        this.resetHandler(iter.timerId);
        return;
      }
    
      const newTime = parseInt(currentTime) - 1,
            newTimeMinutes = Math.floor(newTime / 60),
            newTimeSeconds = newTime % 60,
            newTimeMinutesString = newTimeMinutes.toString(),
            newTimeSecondsString = newTimeSeconds.toString();
    
      if (newTimeMinutes < 10) {
        this.setState( state => {
          const timers = this.state.timers.map((item) => {
            if (item.timerId === parseInt(iter.timerId)) {
              const newItem = item;
              newItem.runningTimeMinutes = "0" + newTimeMinutesString;
              return newItem;
            }
            else {
              return item;
            }
          });
          return {
            timers,
          };
        });
      }
      else {
        this.setState( state => {
          const timers = this.state.timers.map((item) => {
            if (item.timerId === parseInt(iter.timerId)) {
              const newItem = item;
              newItem.runningTimeMinutes = newTimeMinutesString;
              return newItem;
            }
            else {
              return item;
            }
          });
          return {
            timers,
          };
        });
      }
    
      if (newTimeSeconds < 10) {
        this.setState( state => {
          const timers = this.state.timers.map((item) => {
            if (item.timerId === iter.timerId) {
              const newItem = item;
              newItem.runningTimeSeconds ="0" + newTimeSecondsString;
              return newItem;
            }
            else {
              return item;
            }
          });
          return {
            timers,
          };
        });
      }
      else {
        this.setState( state => {
          const timers = this.state.timers.map((item) => {
            if (item.timerId === iter.timerId) {
              const newItem = item;
              newItem.runningTimeSeconds = newTimeSecondsString;
              return newItem;
            }
            else {
              return item;
            }
          });
          return {
            timers,
          };
        });
        this.setState({
          runningTimeSeconds: newTimeSecondsString
        });
      }
    });
  }
  
  resetHandler(timerId) {
    const currentTimer = 
          this.state.timers.find((item) => item.timerId === timerId);
    
    if (currentTimer.isRunning) {
      this.toggleStartStop(timerId);
    }
    const newRunningTimeSeconds = "00";
    
    this.setState( state => {
      const timers = this.state.timers.map((item) => {
        if (item.timerId === timerId) {
          const newItem = item;
          newItem.runningTimeSeconds = newRunningTimeSeconds;
          newItem.runningTimeMinutes = addLeadingZero(item.originalTime.toString());
          newItem.progress = 0;
          return newItem;
        }
        else {
          return item;
        }
      });
      return {
        timers,
      };
    });
  }
  
  toggleStartStop(timerId) {    
    const currentTimer = 
          this.state.timers.find((item) => item.timerId === timerId);
    
    if (currentTimer.isRunning) {
      this.setState( state => {
        const timers = this.state.timers.map((item) => {
          if (item.timerId === timerId) {
            const newItem = item;
            newItem.isRunning = false;
            return newItem;
          }
          else {
            return item;
          }
        });
        return {
          timers,
        };
      });
    }
    else {
      /* The following is a little hack to get mobile safari to play sounds */
      document.getElementById('beep').load();
      let playPromise = document.getElementById('beep').play();
      if( playPromise !== undefined ) {
        playPromise.then( _ => {
          document.getElementById('beep').pause();
        });
      }
      let emptyUtterance = new SpeechSynthesisUtterance(" ");
      synth.speak(emptyUtterance);
      /* End of the little hack to get mobile safari to play sounds */

      this.setState( state => {
        const timers = this.state.timers.map((item) => {
          if (item.timerId === timerId) {
            const newItem = item;
            newItem.isRunning = true;
            return newItem;
          }
          else {
            return item;
          }
        });
        return {
          timers,
        };
      });
    }
  }
  
  increaseTogglerHandler(timerId) {
    const newRunningTimeSeconds = "00";
    
    const currentTimer = 
          this.state.timers.find((item) => item.timerId === timerId);
    
    if (! currentTimer.isRunning ) {
      if (currentTimer.originalTime === 60) {
        return;
      }
      this.setState( state => {
        const timers = this.state.timers.map((item) => {
          if (item.timerId === parseInt(timerId)) {
            const newItem = item;
            newItem.runningTimeSeconds = newRunningTimeSeconds;
            newItem.runningTimeMinutes = addLeadingZero((item.originalTime + 1).toString());
            newItem.originalTime = item.originalTime + 1;
            return newItem;
          }
          else {
            return item;
          }
        });
        return {
          timers,
        };
      });
    }
    // add the increase functionality when the clock is running.
    // Make sure to use locks to avoid race conditions.
  }
  
  decreaseTogglerHandler(timerId)
  {
    const newRunningTimeSeconds = "00";
    
    const currentTimer = 
          this.state.timers.find((item) => item.timerId === timerId);
    
    if (! currentTimer.isRunning ) {
      if (currentTimer.originalTime === 1) {
        return;
      }
      this.setState( state => {
        const timers = this.state.timers.map((item) => {
          if (item.timerId === parseInt(timerId)) {
            const newItem = item;
            newItem.runningTimeSeconds = newRunningTimeSeconds;
            newItem.runningTimeMinutes = addLeadingZero((item.originalTime - 1).toString());
            newItem.originalTime = item.originalTime - 1;
            return newItem;
          }
          else {
            return item;
          }
        });
        return {
          timers,
        };
      });
    }
  }  
  
  addTimer() {
    this.setState(state => {
      const timers = this.state.timers.concat(
        {
          savedOrder: "",
          timerId: this.state.nextTimerId,
          isRunning: false,
          color: findTimerColor(this.state.nextTimerId),
          progress: 0,
          alarmMessage: '',
          runningTimeMinutes: "01",
          runningTimeSeconds: "00",
          originalTime: 1
        }
      );
 
      return {
        timers,
        nextTimerId: this.state.nextTimerId + 1,
      };
    });
  }
  
  
  deleteTimer(timerIdToDelete) {
    let _timers = [...this.state.timers];
    let toDelete = _timers.find((item) => item.timerId === timerIdToDelete);
    let index = _timers.indexOf(toDelete);
    if (index !== -1) {
      freeTimerColor(timerIdToDelete);
      _timers.splice(index, 1);
      this.setState({timers: _timers});
    }
  }
  
  handleClickOnGrip(e, timerId) {
    let isFullyLoaded = false;
    let draggedElement =
      document.getElementById(timerId);
    let positionSave = draggedElement.style.position;
    let opacitySave = draggedElement.style.opacity;
    let zIndexSave = draggedElement.style.zIndex;
    let topSave = draggedElement.style.top;
    let leftSave = draggedElement.style.left;
    let widthSave = draggedElement.style.width;
    
    let rect = draggedElement.getBoundingClientRect();
    draggedElement.style.width = (rect.right - rect.left) + "px";

    let xOffset = e.clientX - rect.left;
    let yOffset = e.clientY - rect.top;
  
    draggedElement.style.position = "absolute";
    draggedElement.style.opacity = "0.9";
    draggedElement.style.zIndex = "99";
    draggedElement.style.top = rect.top + "px";
    draggedElement.style.left = rect.left + "px";
    let hitboxes = [];

    let timerSockets = [];
    for( let iter of this.state.timers ) {
      let iterElement = document.getElementById(iter.timerId);
      let rectIter = iterElement.getBoundingClientRect();
      timerSockets.push({elmn: iterElement.parentElement, timerId: iter.timerId});
      let newTop =
        rectIter.top
        + ((rectIter.bottom - rectIter.top) / 2)
        - ((rectIter.bottom - rectIter.top) / 3);
      let newBottom = 
        rectIter.top
        + ((rectIter.bottom - rectIter.top) / 2)
        + ((rectIter.bottom - rectIter.top) / 3);
      let newLeft = 
        rectIter.left
        + ((rectIter.right - rectIter.left) / 2)
        - ((rectIter.bottom - rectIter.top) / 3);
      let newRight = 
        rectIter.left
        + ((rectIter.right - rectIter.left) / 2)
        + ((rectIter.bottom - rectIter.top) / 3);
      hitboxes.push(
        {
          timerId: iter.timerId,
          elmn: iterElement,
          top: newTop,
          bot: newBottom,
          left: newLeft,
          right: newRight
        }
      );
    }
    console.log("hitboxes:", hitboxes);
    timerSockets.sort( (a, b) => {
        let aOrder = a.elmn.style.order;
        let bOrder = b.elmn.style.order;
        if( aOrder !== undefined && bOrder !== undefined ) {
          return (( aOrder < bOrder ) ? -1 : 1 );
        }
        if( aOrder === undefined ) { return 1; }
        return -1;
      }                
    );
    for( let i = 0; i < timerSockets.length; i++ ) {
      let socket = timerSockets[i];
      socket.elmn.style.order = i;
      console.log(`timerSocket ${socket.timerId} order: ${socket.elmn.style.order} i: ${i}`);
    }
    console.log("sockets:", timerSockets);
    isFullyLoaded = true;
    document.onmouseup = (e) => {
      draggedElement.style.position = positionSave;
      draggedElement.style.opacity = opacitySave;
      draggedElement.style.zIndex = zIndexSave;
      draggedElement.style.top = topSave;
      draggedElement.style.left = leftSave;
      draggedElement.style.width = widthSave;
  
      document.onmouseup = null;
      document.onmousemove = null;
    };
  
    document.onmousemove = (e) => {
      e = e || window.event;
      e.preventDefault();
      if( !isFullyLoaded ) {
        return;
      }
      draggedElement.style.top = (e.clientY - yOffset) + "px";
      draggedElement.style.left = (e.clientX - xOffset) + "px";
      let posY = e.clientY;
      let posX = e.clientX;
      for( let iter of hitboxes ) {
        if( posX < iter.right
            && posX > iter.left
            && posY > iter.top
            && posY < iter.bot)
        {
          if( timerId != iter.timerId ) {
              console.log(`handleMouseEnter: fromId: ${timerId} targetId: ${iter.timerId}`);
              this.handleMouseEnterAlarm(timerId, iter.timerId, timerSockets, hitboxes);
              break;                     
          }
        }
      }
    }
  }
  
  handleMouseEnterAlarm(fromId, targetId, sockets, hitboxes) {
    let fromSocket = document.getElementById(fromId);
    let targetSocket = document.getElementById(targetId);
    let fromSocketOrder = parseInt(fromSocket.parentElement.style.order);
    let targetSocketOrder = parseInt(targetSocket.parentElement.style.order);
    let isAdd = true;
    if( fromSocketOrder < targetSocketOrder ) {
      isAdd = false;
    }
    let newOrders = [];
    for( let iter of sockets ) {
      let elmnOrder = parseInt(iter.elmn.style.order);
      if( iter.timerId === fromId ) {
        newOrders.push(
          {timerId: iter.timerId, order: targetSocketOrder.toString()}
        );
        continue;
      }
      if( isAdd ) {
        if( elmnOrder >= targetSocketOrder
         && elmnOrder < fromSocketOrder )
        {
          iter.elmn.style.order = (elmnOrder + 1).toString();
          newOrders.push(
            {timerId: iter.timerId, order: (elmnOrder + 1).toString()}
          );
        }
        else {
          newOrders.push(
            {timerId: iter.timerId, order: (elmnOrder).toString()}
          );
        }
      }
      else {
        if( elmnOrder <= targetSocketOrder
         && elmnOrder > fromSocketOrder )
        {
          iter.elmn.style.order = (elmnOrder - 1).toString();
          newOrders.push(
            {timerId: iter.timerId, order: (elmnOrder - 1).toString()}
          );
        }
        else {
          newOrders.push(
            {timerId: iter.timerId, order: (elmnOrder).toString()}
          );
        }
      }
    }
    fromSocket.style.order = targetSocketOrder;
    console.log("newOrders:", newOrders);
    this.setState({orders: newOrders});
    for( let iter of hitboxes) {
      let rectIter = iter.elmn.getBoundingClientRect();
      let newTop =
        rectIter.top
        + ((rectIter.bottom - rectIter.top) / 2)
        - ((rectIter.bottom - rectIter.top) / 3);
      let newBottom = 
        rectIter.top
        + ((rectIter.bottom - rectIter.top) / 2)
        + ((rectIter.bottom - rectIter.top) / 3);
      let newLeft = 
        rectIter.left
        + ((rectIter.right - rectIter.left) / 2)
        - ((rectIter.bottom - rectIter.top) / 3);
      let newRight = 
        rectIter.left
        + ((rectIter.right - rectIter.left) / 2)
        + ((rectIter.bottom - rectIter.top) / 3);
      iter.top = newTop;
      iter.left = newLeft;
      iter.right = newRight;
      iter.bot = newBottom;
    }
  }
  
  render() {
    return (
       <div className="alarm-container">
         { 
           this.state.timers.map((item, i) => (
               <Timer message={item.alarmMessage}
                 handleMessageChange={this.handleMessageChange}
                 toggleStartStop={this.toggleStartStop}
                 resetHandler={this.resetHandler}
                 decreaser={this.decreaseTogglerHandler}
                 increaser={this.increaseTogglerHandler}
                 gripClick={this.handleClickOnGrip}
                 mouseEnterAlarm={this.handleMouseEnterAlarm}
                 timerId={item.timerId}
                 timerWidth={item.width}
                 progress={item.progress}
                 bgColor={item.color}
                 order={findOrder(item.timerId, this.state.orders)}
                 deleteTimer={this.deleteTimer}
                 runningTimeSeconds={item.runningTimeSeconds}
                 runningTimeMinutes={item.runningTimeMinutes} />
           ))
         }
         { this.state.timers.length < timerColors.length &&
         <a href="#" className="add-timer" onClick={this.addTimer}>
           <i className="fas fa-plus plus-symbol"></i>
         </a>
         }
         <audio id="beep"
                src={gongURL} 
                type="audio/wav" />
       </div>
    );
  }
};

class Timer extends React.Component {
  constructor(props) {
    super(props);
    this.mountStyle = this.mountStyle.bind(this);
    this.unMountStyle = this.unMountStyle.bind(this);
    this.state = { 
      style: {
        opacity: 0,
        transition: 'all 2s ease',
      }
    };
  }
  
  componentDidMount() {
    setTimeout(this.mountStyle, 10);
    let elem = document.getElementById(this.props.timerId);
    let paren = elem.parentElement;
    let parenRect = paren.getBoundingClientRect();
    elem.style.width = (parenRect.right - parenRect.left) + "px";
  }
  
  unMountStyle() {
    this.setState({
      style: {
        opacity: 0,
        transition: 'all 1s ease',
      }
    })
  }
  
  mountStyle() {
    this.setState({
      style: {
        opacity: 1,
        transition: 'all 1s ease',
      }
    })
  }
  
  render() {
    const timerStyle =  {
      opacity: this.state.style.opacity,
      transition: this.state.style.transition,
      background: this.props.bgColor,
    }
    const progressBarWidth = {
      width: this.props.progress + "%",
    };
    return (
      <div className="timerSocket" style={this.props.order}>
        <div className="timer"
             id={this.props.timerId}
             style={timerStyle}>
          <div className="close-symbol-container">
            <div onMouseDown={(e) => this.props.gripClick(e, this.props.timerId)}>
              <i class="fas fa-grip-horizontal grip-symbol"></i>
            </div>
            <a href="#" onClick={() => this.props.deleteTimer(this.props.timerId)}>
              <i className="far fa-times-circle close-symbol" />
            </a>
          </div>
          <div className="progressBar" style={progressBarWidth}></div>
          <div className="timer-display">
            <input placeholder="Your alarm message here"
                   className="alarm-message"
                   value={this.props.message}
                   onChange={(e) => this.props.handleMessageChange(e, this.props.timerId)} />
            <br />
            <div className="toggler-and-display">
              <button onClick={() => this.props.decreaser(this.props.timerId)}
                      className="btn btn-secondary padded-button">
                <i className="fas fa-chevron-down" />
              </button>
              <h2 className="countdown">
                {this.props.runningTimeMinutes}:{this.props.runningTimeSeconds}
              </h2>
              <button onClick={() => this.props.increaser(this.props.timerId)}
                      className="btn btn-secondary padded-button">
                <i className="fas fa-chevron-up" />
              </button>
            </div>
          </div>
          <br />
          <div className="start-stop-reset-controls">
            <button onClick={() => this.props.toggleStartStop(this.props.timerId)}
                    className="btn btn-secondary btn-lg">
              <i className="fas fa-play"></i>
              <i className="fas fa-pause"></i>
            </button> 
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <button onClick={() => this.props.resetHandler(this.props.timerId)}
                    className="btn btn-secondary btn-lg">
              <i className="fas fa-recycle"></i>
            </button>
          </div>
        </div>
      </div>
    );
  }
};

render(<App />, document.getElementById('app'));
