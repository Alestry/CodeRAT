//Function to get the current timestamp
function getTimeStamp(){
    date = new Date();
    currentYear = date.getFullYear();
    currentMonth = date.getMonth() + 1;
    currentDay = date.getDate();
    currentHour = date.getHours();
    currentMinute = date.getMinutes();
    currentSeconds = date.getSeconds();
    currentMilliseconds = date.getTime() % 1000;
    timeStamp = currentYear + "/" + currentMonth + "/" + currentDay + "-" + currentHour + ":" + currentMinute + ":" + currentSeconds + ":" + currentMilliseconds;
    return timeStamp;
}

//Function to log the current timestamp with the current element
function log(element) {
    timeStamp = getTimeStamp();
    console.log(timeStamp);
    console.log(element);
}


//Get element clicked
document.addEventListener("click", function (e){
    e = e || window.event;
    var target = e.target || e.srcElement;
    log(target);
}, false);