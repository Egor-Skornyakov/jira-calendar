( function(){

    $(function () {

        $.each( $('.site'), function () {

            new Calendar( $(this) );

        } );

    } );

    var Calendar = function (obj) {

        //private properties
        var _obj = obj,
            _users = _obj.find('.users'),
            _calendar = _obj.find('.calendar'),
            _calendarContent = _calendar.filter('.calendar_content'),
            _calendarHead = _calendar.filter('.calendar_head'),
            _yearArr = [new Date().getFullYear()],
            _startYear = new Date().getFullYear(),
            _startMonth = 0,
            _startDate = 1,
            _endYear = new Date().getFullYear(),
            _endMonth = parseInt( new Date().getMonth()) + 1,
            _endDate = new Date().getDate(),
            _vacationPerYear = parseInt( availableVacationsDays ),
            _sicksPerYear = parseInt( availableSickDays ),
            _select,
            _countAllUsers = 0,
            _countUsers = 0,
            _updateFlag = false,
            _swiper,
            _request = new XMLHttpRequest();

        //private methods

        var _addEvents = function () {

                $(document).on('mousewheel',function(event, delta) {

                    if (event.originalEvent.wheelDeltaX !== 0) {

                        event.preventDefault();

                    }

                } );
                $(document).on(
                    'change',
                    '[name="month"]',
                    function() {

                        var curItem = $(this),
                            valueMonth = curItem.val(),
                            selectWrap = curItem.parent(),
                            user = curItem.parents('.users__item'),
                            userName = user.attr('data-name'),
                            yearSelect = curItem.parents('.users__range').find('[name="year"]'),
                            valueYear = yearSelect.val();

                        _updateFlag = true;
                        _select = selectWrap;

                        _select.addClass('websters-select_loading');
                        _putWorkBeginning(userName, parseInt(valueMonth), valueYear);

                    }
                );
                $(document).on(
                    'change',
                    '[name="year"]',
                    function() {

                        var curItem = $(this),
                            valueYear = curItem.val(),
                            selectWrap = curItem.parent(),
                            user = curItem.parents('.users__item'),
                            userName = user.attr('data-name'),
                            monthSelect = curItem.parents('.users__range').find('[name="month"]'),
                            valueMonth = monthSelect.val();

                        _updateFlag = true;
                        _select = selectWrap;

                        if( valueYear == _endYear && valueMonth > _endMonth - 1 ) {

                            valueMonth = 0

                        }

                        _select.addClass('websters-select_loading');
                        _putWorkBeginning(userName, parseInt(valueMonth), valueYear);

                    }
                );
                _calendar.on({
                    mousemove: function (e) {

                        _obj.find('.calendar__decorator-hover').addClass('visible');

                        var e = window.event;

                        var posX = e.clientX;

                        _calendarHead.find('.calendar__content .calendar__month>div>div').each(function () {

                            var curItem = $(this),
                                offsetLeft = $(this).offset().left,
                                width = curItem.width();

                            if( posX >= offsetLeft && posX < offsetLeft + width ) {

                                _obj.find('.calendar__decorator-hover').removeClass('visible');
                                _obj.find('.calendar__decorator-hover').addClass('visible');
                                _obj.find('.calendar__decorator-hover').offset( {left: offsetLeft});

                            }

                        });

                    },
                    mouseleave: function (e) {

                        _obj.find('.calendar__decorator-hover').removeClass('visible');

                    }
                });

            },
            _addYearsToArr = function(year) {

                if( _yearArr.length ) {

                    if( _yearArr.indexOf(year) != 0 ) {

                        _yearArr.push(year);

                    }

                } else {

                    _yearArr.push(year);

                }

            },
            _deleteLoading = function() {

                var loading = _obj.find('.site__loading');

                loading.addClass('hidden');

                setTimeout( function() {
                    loading.remove();
                }, 300 );

            },
            _calculateFreeDaysForUser = function(vacationObj, sickObj, userName) {

                var vacationWorkLogs = vacationObj.worklogs,
                    sickWorkLogs = sickObj.worklogs,
                    vacationsArr = [],
                    sicksArr = [];

                var user,
                    name,
                    startDateMonth,
                    startDateYear;

                if( userName != undefined ) {

                    _calendarContent.find('.calendar__row').eq(_users.find('.users__item[data-name="'+ userName +'"]').index()).find('.calendar__month div div').html('');

                    user = _users.find('.users__item[data-name="'+ userName +'"]');
                    name = userName;
                    startDateMonth = parseInt(user.attr('data-start-month'))+1;
                    startDateYear = user.attr('data-start-year');

                    calculating(name, startDateYear, startDateMonth);

                } else {

                    $.each( _users.find('.users__item'), function() {

                        user = $(this);
                        name = user.attr('data-name');
                        startDateMonth = parseInt(user.attr('data-start-month'))+1;
                        startDateYear = user.attr('data-start-year');

                        vacationsArr = [];
                        sicksArr = [];

                        calculating(name, startDateYear, startDateMonth);

                    } );

                }

                function calculating( name, startYear, startMonth  ) {

                    $.each( vacationWorkLogs, function() {

                        var userWorkLogs = this,
                            userWorkLogsName = userWorkLogs.author.name,
                            dateStarted = userWorkLogs.started;

                        if( (userWorkLogsName == name) && new Date(dateStarted.split('T')[0]).getTime() >= new Date(startYear + '/' + startMonth + '/01' ).getTime()) {

                            vacationsArr.push(dateStarted.split('T')[0])

                        }

                    } );
                    $.each( sickWorkLogs, function() {

                        var userWorkLogs = this,
                            userWorkLogsName = userWorkLogs.author.name,
                            dateStarted = userWorkLogs.started;

                        if( (userWorkLogsName == name) && new Date(dateStarted.split('T')[0]).getTime() >= new Date(startYear + '/' + startMonth + '/01' ).getTime()) {

                            sicksArr.push(dateStarted.split('T')[0])

                        }

                    } );

                    _createVacationDays(vacationsArr, name );
                    _calculateTotalVacationDaysForUser(vacationsArr.length, name);
                    _createSickDays(sicksArr, name);
                    _calculateTotalSickDaysForUser(sicksArr, name);

                }

            },
            _calculateTotalVacationDaysForUser = function( vacationCount, userName ) {

                var vacationTotalDays = vacationCount,
                    username = userName,
                    user = _users.find('.users__item[data-name="'+ username +'"]'),
                    startDateMonth = _users.find('.users__item[data-name="'+ username +'"]').attr('data-start-month'),
                    startDateYear = _users.find('.users__item[data-name="'+ username +'"]').attr('data-start-year'),
                    month = parseInt(startDateMonth),
                    year = parseInt(startDateYear),
                    availableVacationDays = 0,
                    availableYears = 0,
                    countVacationDays = 0;

                user.find('.holidays').removeClass('arrear');
                user.find('.holidays').removeClass('empty');
                user.find('.holidays').parent().removeClass('users__rest-days_empty');

                availableYears = _endYear - year - 1;

                if( availableYears < 0 ) {

                    availableYears = 0;

                }
                availableVacationDays = availableYears * _vacationPerYear;

                if( year < _endYear ) {

                    countVacationDays = Math.ceil( ((_vacationPerYear / 12) * ( (11 - month) + 1 )) + (( _vacationPerYear / 12) * _endMonth) );

                } else {

                    if(  _endMonth - 1 == month ) {

                        countVacationDays = Math.ceil( (_vacationPerYear / 12) );

                    } else {

                        countVacationDays = Math.ceil( (_vacationPerYear / 12) * ( _endMonth - month ));

                    }

                }

                availableVacationDays = availableVacationDays + countVacationDays;

                user.find('.holidays').text(availableVacationDays - vacationTotalDays);

                if( (availableVacationDays - vacationTotalDays) < 0 ) {

                    user.find('.holidays').addClass('arrear');

                } else if( (availableVacationDays - vacationTotalDays) == 0 ) {

                    user.find('.holidays').addClass('empty');
                    user.find('.holidays').parent().addClass('users__rest-days_empty');

                }

            },
            _calculateTotalSickDaysForUser = function( sickArr, userName ) {

                var sickTotalDays = sickArr,
                    username = userName,
                    user = _users.find('.users__item[data-name="'+ username +'"]'),
                    startDateMonth = _users.find('.users__item[data-name="'+ username +'"]').attr('data-start-month'),
                    startDateYear = _users.find('.users__item[data-name="'+ username +'"]').attr('data-start-year'),
                    month = parseInt(startDateMonth)+1,
                    year = parseInt(startDateYear),
                    availableSickDays = 0,
                    sickDaysInMonth = 0,
                    countSickDays = 0;

                if( year == _endYear ) {

                    for( var i = 0; i <= sickTotalDays.length-1; i++ ) {

                        sickDaysInMonth++;

                    }

                } else {

                    for( var i = 0; i <= sickTotalDays.length-1; i++ ) {

                        if( month <= _endMonth ) {

                            if( new Date(sickTotalDays[i]).getTime() >= new Date( _endYear + '/' + month + '/01').getTime() ) {

                                sickDaysInMonth++;

                            }

                        } else {

                            if( new Date(sickTotalDays[i]).getTime() >= new Date( (_endYear-1) + '/' + month + '/01').getTime() ) {

                                sickDaysInMonth++;

                            }

                        }

                    }

                }
                user.find('.sick').removeClass('arrear');
                user.find('.sick').removeClass('empty');
                user.find('.sick').parent().removeClass('users__rest-days_empty');

                countSickDays = _sicksPerYear;

                availableSickDays = countSickDays;

                user.find('.sick').text(availableSickDays - sickDaysInMonth);

                if( (availableSickDays - sickDaysInMonth) < 0 ) {

                    user.find('.sick').addClass('arrear');

                } else if( (availableSickDays - sickDaysInMonth) == 0 ) {

                    user.find('.sick').addClass('empty');
                    user.find('.sick').parent().addClass('users__rest-days_empty');

                }

            },
            _createCalendar = function(startYear, startMonth, userName ) {

                var year,
                    month,
                    nowDateYear,
                    nowDateMonth,
                    calendarRow,
                    separateClass = 'separate';

                if( userName == '' ) {

                    year = startYear;
                    month = startMonth;
                    nowDateYear = new Date().getFullYear();
                    nowDateMonth = _endMonth - 1;
                    calendarRow = '<div class="calendar__row">';

                } else {

                    var user = _users.find('.users__item[data-name="'+ userName +'"]'),
                        startDateMonth = user.attr('data-start-month'),
                        startDateYear = user.attr('data-start-year'),
                        userCalendarRow = _calendarContent.find('.calendar__content .calendar__row').eq( user.index());

                    month = parseInt(startDateMonth);
                    year = parseInt(startDateYear);
                    nowDateYear = new Date().getFullYear();
                    nowDateMonth = _endMonth - 1;
                    calendarRow = '';

                    userCalendarRow.addClass('calendar__row_loading');

                }

                _addYearsToArr(year);

                for( var i = nowDateYear; i >= year; i-- ) {

                    calendarRow += '<div data-year="'+ i +'" class="calendar__month"><div>';

                    if( nowDateYear != year ) {

                        if( i == nowDateYear ) {

                            for( var j = 0; j <= 11; j++ ) {

                                separateClass = '';

                                if( (11 - j) == month ) {

                                    separateClass = 'separate';
                                }

                                if( (11 - j) > nowDateMonth ) {

                                    calendarRow += '<div class="non-available '+ separateClass +'" data-month="'+ (11-j) +'"></div> ';


                                } else {

                                    calendarRow += '<div class="'+ separateClass +'" data-month="'+ (11-j) +'"></div> ';

                                }

                            }

                        } else if( i == year ) {

                            for( var j = 0; j <= (11 - month); j++ ) {

                                separateClass = '';

                                if( (11 - j) == month ) {

                                    separateClass = 'separate';
                                }

                                calendarRow += '<div class="'+ separateClass +'" data-month="'+ (11-j) +'"></div> ';

                            }

                        } else {

                            for( var j = 0; j <= 11; j++ ) {

                                separateClass = '';

                                if( (11 - j) == month ) {

                                    separateClass = 'separate';
                                }

                                calendarRow += '<div class="'+ separateClass +'" data-month="'+ (11-j) +'"></div> ';

                            }

                        }

                    }
                    else {

                        for( var j = 0; j <= (11 - month); j++ ) {

                            separateClass = '';

                            if( (11 - j) == month ) {

                                separateClass = 'separate';
                            }

                            if( (11 - j) > nowDateMonth ) {

                                calendarRow += '<div class="non-available '+ separateClass +'" data-month="'+ (11-j) +'"></div> ';


                            } else {

                                calendarRow += '<div class="'+ separateClass +'" data-month="'+ (11-j) +'"></div> ';

                            }

                        }

                    }

                    calendarRow += '</div></div>';

                }

                calendarRow += '</div>';

                if( userName == '' ) {

                    _calendarContent.find('.calendar__content').append(calendarRow);


                } else {

                    userCalendarRow.html(calendarRow);

                    _updateYearsHead();

                }

                $('.calendar__row').each( function () {

                    var curItem = $(this),
                        column = curItem.find('.calendar__month'),
                        width = 0;

                    for( var i = 0; i <= column.length-1; i++ ) {

                        width += $(column[i]).outerWidth(true);

                    }

                    curItem.width(width);

                } );

                _updateScroll();

            },
            _createRange = function() {

                _calendarContent.find('.calendar__content').html('');

                var monthArr = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
                    nowDateYear = new Date().getFullYear(),
                    nowDateMonth = _endMonth - 1;

                _users.find('.users__item').each( function() {

                    var curItem = $(this),
                        startDateMonth = curItem.attr('data-start-month'),
                        startDateYear = curItem.attr('data-start-year'),
                        month = parseInt(startDateMonth),
                        year = parseInt(startDateYear),
                        monthArr = ["Января","Февраля","Марта","Апреля","Мая","Июня","Июля","Августа","Сентября","Октября","Ноября","Декабря"],
                        range = '';

                    range += 'Работает с ';
                    range += '<select name="month" id="month'+ curItem.index() +'">';

                    if( year < _endYear ) {

                        for( var i = 0; i <= 11; i++ ) {

                            range += '<option value="'+ i +'">'+ monthArr[i] +'</option>'

                        }

                    } else {

                        for( var i = 0; i < _endMonth; i++ ) {

                            range += '<option value="'+ i +'">'+ monthArr[i] +'</option>'

                        }

                    }

                    range += '</select> ';

                    range += '<select name="year" id="year'+ curItem.index() +'">';

                    for( var i = nowDateYear; i >= 2009; i-- ) {

                        range += '<option value="'+ i +'">'+ i +'</option>'

                    }

                    range += '</select>';

                    curItem.find('.users__range').html(range);

                    curItem.find('[name=month] option[value='+ (month) +']').prop( 'selected', true );
                    curItem.find('[name=month] option[value='+ (month) +']').attr( 'selected', 'selected' );

                    curItem.find('[name=year] option[value='+ year +']').prop( 'selected', true );
                    curItem.find('[name=year] option[value='+ year +']').attr( 'selected', 'selected' );

                    _createCalendar(year, month, '');

                } );

                _createYearsHead();

                $( 'select' ).each( function() {
                    new WebstersSelect( {
                        obj: $( this ),
                        optionType: 1,
                        showType: 2
                    } );
                } );

            },
            _createVacationDays = function(arr, user) {

                var vacationsArr = arr.sort(),
                    userName = user,
                    index = _users.find('.users__item[data-name="'+ userName +'"]').index(),
                    countDays = 0,
                    strDate = new Date(vacationsArr[0]).getFullYear() +'/'+  new Date(vacationsArr[0]).getMonth();

                for( var i = 0; i <= vacationsArr.length-1; i++ ) {

                    var label = '';

                    if( new Date(vacationsArr[i]).getFullYear() +'/'+ new Date(vacationsArr[i]).getMonth() == strDate ) {

                        countDays++;

                        if( i == vacationsArr.length-1 ) {

                            label = '<span class="calendar__free-days calendar__vacation">'+ countDays +'</span>';

                            _calendarContent.find('.calendar__row').eq(index).find('.calendar__month[data-year='+ (new Date(vacationsArr[i]).getFullYear()) +'] div div[data-month='+ (new Date(vacationsArr[i]).getMonth()) +']').append(label);

                        }


                    } else {

                        label = '<span class="calendar__free-days calendar__vacation">'+ countDays +'</span>';

                        _calendarContent.find('.calendar__row').eq(index).find('.calendar__month[data-year='+ (new Date(vacationsArr[i-1]).getFullYear()) +'] div div[data-month='+ (new Date(vacationsArr[i-1]).getMonth()) +']').append(label);

                        countDays = 1;

                        strDate = new Date(vacationsArr[i]).getFullYear() +'/'+ new Date(vacationsArr[i]).getMonth();


                        if( i == vacationsArr.length-1 ) {

                            label = '<span class="calendar__free-days calendar__vacation">'+ 1 +'</span>';

                            _calendarContent.find('.calendar__row').eq(index).find('.calendar__month[data-year='+ (new Date(vacationsArr[i]).getFullYear()) +'] div div[data-month='+ (new Date(vacationsArr[i]).getMonth()) +']').append(label);

                        }

                    }

                }

            },
            _createSickDays = function(arr, user) {

                var sickArr = arr.sort(),
                    userName = user,
                    index = _users.find('.users__item[data-name="'+ userName +'"]').index(),
                    countDays = 0,
                    strDate = new Date(sickArr[0]).getFullYear() +'/'+ new Date(sickArr[0]).getMonth();

                for( var i = 0; i <= sickArr.length-1; i++ ) {

                    var label = '';

                    if( new Date(sickArr[i]).getFullYear() +'/'+ new Date(sickArr[i]).getMonth() == strDate ) {

                        countDays++;

                        if( i == sickArr.length-1 ) {

                            label = '<span class="calendar__free-days calendar__sick">'+ countDays +'</span>';

                            _calendarContent.find('.calendar__row').eq(index).find('.calendar__month[data-year='+ (new Date(sickArr[i]).getFullYear()) +'] div div[data-month='+ (new Date(sickArr[i]).getMonth()) +']').append(label);

                        }

                    } else {

                        label = '<span class="calendar__free-days calendar__sick">'+ countDays +'</span>';

                        _calendarContent.find('.calendar__row').eq(index).find('.calendar__month[data-year='+ (new Date(sickArr[i-1]).getFullYear()) +'] div div[data-month='+ (new Date(sickArr[i-1]).getMonth()) +']').append(label);

                        countDays = 1;

                        strDate = new Date(sickArr[i]).getFullYear() +'/'+ new Date(sickArr[i]).getMonth();

                        if( i == sickArr.length-1 ) {

                            label = '<span class="calendar__free-days calendar__sick">'+ 1 +'</span>';

                            _calendarContent.find('.calendar__row').eq(index).find('.calendar__month[data-year='+ (new Date(sickArr[i]).getFullYear()) +'] div div[data-month='+ (new Date(sickArr[i]).getMonth()) +']').append(label);

                        }


                    }

                }

            },
            _createYearsHead = function() {

                _yearArr.sort( function( a, b ){ return b - a } );
                _calendarHead.find('.calendar__content').html('');

                var startYear = _yearArr[0],
                    endYear = _yearArr[_yearArr.length-1],
                    monthArr = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
                    calendarRow = '<div class="calendar__row calendar__row_capture">';

                for( var i = startYear; i >= endYear; i-- ) {

                    calendarRow += '<div class="calendar__month"><div><span class="calendar__year">'+ i +'</span>';

                    for( var j = 0; j <= 11; j++ ) {

                        calendarRow += '<div>'+ monthArr[(monthArr.length-1) - (j)] +'</div> ';

                    }

                    calendarRow += '</div></div>';

                }

                calendarRow += '</div>';

                _calendarHead.find('.calendar__content').append(calendarRow);

            },
            _getAllUsers = function() {

                _request = $.ajax( {
                    url: 'http://jira-dev.alty.software/rest/api/2/user/search?username=.',
                    data: {},
                    dataType: 'json',
                    type: "get",
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader ("Authorization", "Basic " + btoa(user + ":" + userPassword));
                    },
                    success: function (data) {

                        _insertUsers(data);
                        _countAllUsers = data.length;

                    },
                    error: function (XMLHttpRequest) {
                        if ( XMLHttpRequest.statusText != "abort" ) {
                            console.log("Error");
                        }
                    }
                } );

            },
            _getUserProperties = function(userName) {

                _request = $.ajax( {
                    url: ' http://jira-dev.alty.software/rest/api/2/user/properties/startWork?username='+ userName +'',
                    data: {},
                    dataType: 'json',
                    type: "get",
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader ("Authorization", "Basic " + btoa(user + ":" + userPassword));
                    },
                    success: function (data) {

                        _countUsers++;

                        _users.find('.users__item[data-name="'+ userName +'"]').attr('data-start-month', data.value.startWork.monthStart);
                        _users.find('.users__item[data-name="'+ userName +'"]').attr('data-start-year', data.value.startWork.yearStart);

                        setTimeout( function() {
                            _updateRange(userName);
                            _createCalendar('', '', userName);

                            if( _updateFlag ) {

                                _updateUsersWorkLogs(userName);

                            }

                            if(_countUsers == _countAllUsers) {

                                _countUsers = 0;

                                // _getUsersWorkLogs();
                                _getUsersVacationWorkLogs();

                            }

                        }, 10 );

                    },
                    error: function (XMLHttpRequest) {
                        if ( XMLHttpRequest.statusText != "abort" ) {
                            console.log("Error");
                        }
                    },
                    statusCode: {
                        404: function() {

                            _countUsers++;

                            if(_countUsers == _countAllUsers) {

                                _countUsers = 0;

                                // _getUsersWorkLogs();
                                _getUsersVacationWorkLogs()

                            }

                        }
                    }
                } );

            },
            _getUsersVacationWorkLogs = function(userName) {

                var url = '';

                url = 'http://jira-dev.alty.software/rest/api/2/issue/ALTVSD-1/worklog';

                _request = $.ajax( {
                    url: url,
                    data: {},
                    dataType: 'json',
                    type: "get",
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader ("Authorization", "Basic " + btoa(user + ":" + userPassword));
                    },
                    success: function (data) {

                        _getUsersSickWorkLogs(userName, data)

                    },
                    error: function (XMLHttpRequest) {
                        if ( XMLHttpRequest.statusText != "abort" ) {
                            console.log("Error");
                        }
                    }
                } );

            },
            _getUsersSickWorkLogs = function(userName, vacationObj) {

                var url = '';

                url = 'http://jira-dev.alty.software/rest/api/2/issue/ALTVSD-2/worklog';

                _request = $.ajax( {
                    url: url,
                    data: {},
                    dataType: 'json',
                    type: "get",
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader ("Authorization", "Basic " + btoa(user + ":" + userPassword));
                    },
                    success: function (sickObj) {

                        _calculateFreeDaysForUser(vacationObj, sickObj, userName);

                        setTimeout( function() {

                            _calendarContent.find('.calendar__content .calendar__row').removeClass('calendar__row_loading');

                        }, 300 );


                        if( userName != undefined ) {

                            setTimeout( function() {

                                if( _select != undefined ) {

                                    _select.removeClass('websters-select_loading');

                                }

                            }, 300 );

                        } else {

                            setTimeout( function() {

                                _deleteLoading();

                            }, 400 );

                        }

                    },
                    error: function (XMLHttpRequest) {
                        if ( XMLHttpRequest.statusText != "abort" ) {
                            console.log("Error");
                        }
                    }
                } );

            },
            _initScroll = function() {

                _swiper = new Swiper( _calendarContent, {
                    direction: 'horizontal',
                    slidesPerView: 'auto',
                    mousewheelControl: true,
                    mousewheelForceToAxis: true,
                    freeMode: true,
                    speed: 0 ,
                    mousewheelInvert: true,
                    mousewheelReleaseOnEdges: true,
                    freeModeMomentum: false,
                    onSetTranslate: function(swiper, transition) {

                        _calendarHead.find('.calendar__content').css( {
                            'transition-duration': '0ms',
                            'transform': 'translate3d('+ (transition) +'px, 0px, 0px)'
                        } );

                        _obj.find('.calendar__decorator-hover').removeClass('visible');

                    }
                } );

            },
            _updateScroll = function() {

                _swiper.update();

            },
            _insertUsers = function(data) {

                var users = data;

                _users.html('');

                $.each( users, function() {

                    var singleUser = this,
                        avatar = singleUser.avatarUrls[Object.keys(singleUser.avatarUrls).sort().reverse()[0]],
                        userItem = '<div class="users__item" data-start-month="'+ _startMonth +'" data-start-year="'+ _startYear +'" data-name="'+ singleUser.name +'">';



                    if( avatar == undefined ) {

                        avatar = unknownUserAvatar;

                    }

                    userItem += '<div class="users__pic">\
                                        <img src="'+ avatar +'" width="50" height="50" alt="">\
                                    </div>\
                                    <div class="users__content">\
                                        <div>\
                                            <h2 class="users__name">'+ singleUser.displayName +'</h2>\
                                            <div class="users__range users__range_begin"></div>\
                                        </div>\
                                        <div class="users__rest">\
                                            <div class="users__rest-days">\
                                                <span class="users__rest-count holidays">10</span>\
                                                <p>Отпускных</p>\
                                            </div>\
                                            <div class="users__rest-days">\
                                                <span class="users__rest-count sick">2</span>\
                                                <p>Больничных</p>\
                                            </div>\
                                        </div>\
                                    </div>\
                                </div>';

                    _users.append( userItem );

                    _getUserProperties(singleUser.name);

                } );

                _createRange();

            },
            _putWorkBeginning = function(userName, valueMonth, valueYear) {

                _request = $.ajax( {
                    url: 'http://jira-dev.alty.software/rest/api/2/user/properties/startWork?username='+ userName +'',
                    data: JSON.stringify(
                        {
                            "startWork": {
                                "monthStart": valueMonth,
                                "yearStart": valueYear
                            }
                        }
                    ),
                    headers: {
                        "Content-Type": "application/json;charset=UTF-8"
                    },
                    dataType: 'html',
                    type: "put",
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader ("Authorization", "Basic " + btoa(user + ":" + userPassword));
                    },
                    success: function (data) {

                        _getUserProperties(userName);

                    },
                    error: function (XMLHttpRequest) {
                        if ( XMLHttpRequest.statusText != "abort" ) {
                            console.log("Error");
                        }
                    }
                } );

            },
            _updateYearsHead = function() {

                _yearArr = [new Date().getFullYear()];

                _users.find('.users__item').each( function() {

                    var curItem = $(this),
                        startDateYear = curItem.attr('data-start-year');

                    if( _yearArr.indexOf(startDateYear) != 0 ) {

                        _yearArr.push(startDateYear);

                    }

                } );

                _createYearsHead();

            },
            _updateRange = function(userName) {

                var curItem = _users.find('.users__item[data-name="'+ userName +'"]'),
                    startDateMonth = curItem.attr('data-start-month'),
                    startDateYear = curItem.attr('data-start-year'),
                    month = parseInt(startDateMonth),
                    year = parseInt(startDateYear),
                    monthArr = ["Января","Февраля","Марта","Апреля","Мая","Июня","Июля","Августа","Сентября","Октября","Ноября","Декабря"];

                curItem.find('[name=month]').html('');

                if( year < _endYear ) {

                    for( var i = 0; i <= 11; i++ ) {

                        curItem.find('[name=month]').append('<option value="'+ i +'">'+ monthArr[i] +'</option>') ;

                    }

                } else {

                    for( var i = 0; i < _endMonth; i++ ) {

                        curItem.find('[name=month]').append('<option value="'+ i +'">'+ monthArr[i] +'</option>') ;

                    }

                }

                curItem.find('[name=month] option[value='+ (month) +']').prop( 'selected', true );
                curItem.find('[name=month] option[value='+ (month) +']').attr( 'selected', 'selected' );
                curItem.find('[name=month]').parent().find('.websters-select__item').text( curItem.find('[name=month] option:selected').text());

                curItem.find('[name=year] option[value='+ year +']').prop( 'selected', true );
                curItem.find('[name=year] option[value='+ year +']').attr( 'selected', 'selected' );
                curItem.find('[name=year]').parent().find('.websters-select__item').text( curItem.find('[name=year] option:selected').text());

            },
            _updateUsersWorkLogs = function(userName) {

                _getUsersVacationWorkLogs(userName);

                _updateFlag = false;

            },
            _init = function () {
                _initScroll();
                _addEvents();
                _getAllUsers();

                _calendarContent.append('<span class="calendar__decorator-hover"></span>');
                _calendarHead.append('<span class="calendar__decorator-hover"></span>');

            };

        //public properties

        //public methods

        _init();
    };

} )();
