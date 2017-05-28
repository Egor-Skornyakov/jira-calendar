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
            _startMonth = 1,
            _startDate = 1,
            _endYear = new Date().getFullYear(),
            _endMonth = new Date().getMonth() + 1,
            _endDate = new Date().getDate(),
            _vacationPerYear = parseInt( _users.data('available-vacation-days') ),
            _sicksPerYear = parseInt( _users.data('available-sick-days') ),
            _select,
            _needChangeMonthFlag = false,
            _deleteLoadingFlag = true,
            _request = new XMLHttpRequest();

        //private methods

        var _addEvents = function () {

                _calendarContent.on('ps-scroll-x', function () {

                    _calendarHead.prop( 'scrollLeft', _calendarContent.prop('scrollLeft') );

                } );
                _calendarHead.on('ps-scroll-x', function () {

                    _calendarContent.prop( 'scrollLeft', _calendarHead.prop('scrollLeft') );

                } );

                $(document).on(
                    'change',
                    '[name="month"]',
                    function() {

                        var curItem = $(this),
                            selectWrap = curItem.parent(),
                            user = curItem.parents('.users__item'),
                            userName = user.attr('data-name');

                        _select = selectWrap;

                        _select.addClass('websters-select_loading');
                        _putNewMonth(userName, curItem.val());

                    }
                );
                $(document).on(
                    'change',
                    '[name="year"]',
                    function() {

                        var curItem = $(this),
                            selectWrap = curItem.parent(),
                            user = curItem.parents('.users__item'),
                            userName = user.attr('data-name'),
                            monthSelect = curItem.parents('.users__range').find('[name="month"]');

                        _select = selectWrap;


                        if( curItem.val() == _endYear && monthSelect.val() > _endMonth - 1 ) {

                            _putNewMonth(userName, 0);

                        }

                        _select.addClass('websters-select_loading');
                        _putNewYear(userName, curItem.val());

                    }
                );

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
            _calculateFreeDaysForUser = function(data, userName) {

                _calendarContent.find('.calendar__row').eq(_users.find('.users__item[data-name="'+ userName +'"]').index()).find('.calendar__month div div').html('');

                var workLogs = data,
                    vacationKey = 'ALTVSD-1',
                    sickKey = 'ALTVSD-2',
                    vacationsArr = [],
                    sicksArr = [];

                $.each( workLogs, function() {

                    var userWorkLogs = this,
                        userWorkLogsName = userWorkLogs.author.name,
                        issueKey = userWorkLogs.issue.key,
                        dateStarted = userWorkLogs.dateStarted;

                    if( userWorkLogsName == userName ) {

                        if( vacationKey == issueKey ) {

                            vacationsArr.push(dateStarted)

                        } else if( sickKey == issueKey ) {

                            sicksArr.push(dateStarted)

                        }

                    }

                } );

                _createVacationDays(vacationsArr,userName );
                _calculateTotalVacationDaysForUser(vacationsArr.length, userName);
                _createSickDays(sicksArr, userName);
                _calculateTotalSickDaysForUser(sicksArr, userName);

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

                    countVacationDays = Math.floor( _vacationPerYear / 12 * ( 12 - month ) ) + Math.floor( _vacationPerYear / 12 * ( _endMonth - 0 ) );

                } else {

                    countVacationDays = Math.floor( (_vacationPerYear / 12) * ( _endMonth - month ));

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
                    month = parseInt(startDateMonth) + 1,
                    year = parseInt(startDateYear),
                    availableVacationDays = 0,
                    sickDaysInMonth = 0,
                    countVacationDays = 0;

                for( var i = 0; i <= sickTotalDays.length-1; i++ ) {

                    if( new Date( sickTotalDays[i]).getFullYear() == _endYear ) {

                        sickDaysInMonth++;

                    }

                }

                user.find('.sick').removeClass('arrear');
                user.find('.sick').removeClass('empty');
                user.find('.sick').parent().removeClass('users__rest-days_empty');

                if( year == _endYear ) {

                    countVacationDays = Math.floor( (_sicksPerYear / 12) * ( _endMonth - month + 1 ));


                } else {

                    countVacationDays = Math.floor( (_sicksPerYear / 12) * _endMonth);

                }

                availableVacationDays = countVacationDays;

                user.find('.sick').text(availableVacationDays - sickDaysInMonth);

                if( (availableVacationDays - sickDaysInMonth) < 0 ) {

                    user.find('.sick').addClass('arrear');

                } else if( (availableVacationDays - sickDaysInMonth) == 0 ) {

                    user.find('.sick').addClass('empty');
                    user.find('.sick').parent().addClass('users__rest-days_empty');

                }

            },
            _checkUserProperties = function(data, user) {

                var properties = data,
                    monthStartKey = 'monthStartWork',
                    yearStartKey = 'yearStartWork';

                $.each( properties.keys, function() {

                    var key = this;

                    if( key.key == monthStartKey ) {

                        _deleteLoadingFlag = false;
                        _getUserPropertyMonth(user);

                    }
                    if( key.key == yearStartKey ) {

                        _deleteLoadingFlag = false;
                        _getUserPropertyYear(user);

                    }

                } );

                _createRange();
                _getUsersWorkLogs(user);

            },
            _createCalendar = function(startYear, startMonth) {

                var year = startYear,
                    month = startMonth,
                    nowDateYear = new Date().getFullYear(),
                    nowDateMonth = new Date().getMonth(),
                    calendarRow = '<div class="calendar__row">';

                _addYearsToArr(year);

                for( var i = nowDateYear; i >= year; i-- ) {

                    calendarRow += '<div data-year="'+ i +'" class="calendar__month"><div>';

                    if( nowDateYear != year ) {

                        if( i == nowDateYear ) {

                            for( var j = 0; j <= 11; j++ ) {

                                if( (11 - j) > nowDateMonth ) {

                                    calendarRow += '<div class="non-available" data-month="'+ (11-j) +'"></div> ';

                                } else {

                                    calendarRow += '<div data-month="'+ (11-j) +'"></div> ';

                                }

                            }

                        } else if( i == year ) {

                            for( var j = 0; j <= (11 - month); j++ ) {

                                calendarRow += '<div data-month="'+ (11-j) +'"></div> ';

                            }

                        } else {

                            for( var j = 0; j <= 11; j++ ) {

                                calendarRow += '<div data-month="'+ (11-j) +'"></div> ';

                            }

                        }

                    } else {

                        for( var j = 0; j <= 11; j++ ) {

                            if( (11 - j) > nowDateMonth ) {

                                calendarRow += '<div class="non-available" data-month="'+ (11-j) +'"></div> ';

                            } else {

                                calendarRow += '<div data-month="'+ (11-j) +'"></div> ';

                            }

                        }

                    }

                    calendarRow += '</div></div>';

                }

                calendarRow += '</div>';

                _calendarContent.find('.calendar__content').append(calendarRow);

            },
            _createRange = function() {

                _calendarContent.find('.calendar__content').html('');

                var monthArr = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
                    nowDateYear = new Date().getFullYear(),
                    nowDateMonth = new Date().getMonth();

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

                    for( var i = 2007; i <= nowDateYear; i++ ) {

                        range += '<option value="'+ i +'">'+ i +'</option>'

                    }

                    range += '</select>';

                    curItem.find('.users__range').html(range);

                    curItem.find('[name=month] option[value='+ month +']').prop( 'selected', true );
                    curItem.find('[name=month] option[value='+ month +']').attr( 'selected', 'selected' );

                    curItem.find('[name=year] option[value='+ year +']').prop( 'selected', true );
                    curItem.find('[name=year] option[value='+ year +']').attr( 'selected', 'selected' );

                    _createCalendar(year, month);

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

                var vacationsArr = arr,
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

                            label = '<span class="calendar__free-days calendar__sick">'+ 1 +'</span>';

                            _calendarContent.find('.calendar__row').eq(index).find('.calendar__month[data-year='+ (new Date(vacationsArr[i]).getFullYear()) +'] div div[data-month='+ (new Date(vacationsArr[i]).getMonth()) +']').append(label);

                        }

                    }

                }

            },
            _createSickDays = function(arr, user) {

                var sickArr = arr,
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
                        xhr.setRequestHeader ("Authorization", "Basic " + btoa('anton@alterplay.com' + ":" + 'zaq123'));
                    },
                    success: function (data) {

                        _insertUsers(data);

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
                    url: ' http://jira-dev.alty.software/rest/api/2/user/properties?username='+ userName +'',
                    data: {},
                    dataType: 'json',
                    type: "get",
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader ("Authorization", "Basic " + btoa('anton@alterplay.com' + ":" + 'zaq123'));
                    },
                    success: function (data) {

                        _checkUserProperties(data, userName);

                    },
                    error: function (XMLHttpRequest) {
                        if ( XMLHttpRequest.statusText != "abort" ) {
                            console.log("Error");
                        }
                    }
                } );

            },
            _getUserPropertyMonth = function(userName) {

                _request = $.ajax( {
                    url: ' http://jira-dev.alty.software/rest/api/2/user/properties/monthStartWork?username='+ userName +'',
                    data: {},
                    dataType: 'json',
                    type: "get",
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader ("Authorization", "Basic " + btoa('anton@alterplay.com' + ":" + 'zaq123'));
                    },
                    success: function (data) {

                        _users.find('.users__item[data-name="'+ userName +'"]').attr('data-start-month', data.value.monthStartWork-1);

                        setTimeout( function() {
                            _updateRange(userName);
                            _updateCalendarForUser(userName);
                            _getUsersWorkLogs(userName);
                            _deleteLoadingFlag = true;
                        }, 10 );


                    },
                    error: function (XMLHttpRequest) {
                        if ( XMLHttpRequest.statusText != "abort" ) {
                            console.log("Error");
                        }
                    }
                } );

            },
            _getUserPropertyYear = function(userName) {

                _request = $.ajax( {
                    url: ' http://jira-dev.alty.software/rest/api/2/user/properties/yearStartWork?username='+ userName +'',
                    data: {},
                    dataType: 'json',
                    type: "get",
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader ("Authorization", "Basic " + btoa('anton@alterplay.com' + ":" + 'zaq123'));
                    },
                    success: function (data) {

                        _users.find('.users__item[data-name="'+ userName +'"]').attr('data-start-year', data.value.yearStartWork);

                        setTimeout( function() {
                            _updateRange(userName);
                            _updateCalendarForUser(userName);
                            _getUsersWorkLogs(userName);
                            _deleteLoadingFlag = true;
                        }, 10 )

                    },
                    error: function (XMLHttpRequest) {
                        if ( XMLHttpRequest.statusText != "abort" ) {
                            console.log("Error");
                        }
                    }
                } );

            },
            _getUsersWorkLogs = function(userName) {

                var url = '';

                if( userName != undefined ) {

                    var user = _users.find('.users__item[data-name="'+ userName +'"]'),
                        startDateMonth = user.attr('data-start-month'),
                        startDateYear = user.attr('data-start-year'),
                        month = parseInt(startDateMonth)+1,
                        year = parseInt(startDateYear);

                    url = 'http://jira-dev.alty.software/rest/tempo-timesheets/3/worklogs/?dateFrom='+ year +'-'+ month +'-'+ _startDate +'&dateTo='+ _endYear +'-'+ _endMonth +'-'+ _endDate +'&projectKey=ALTVSD&username='+ userName +''

                }

                _request = $.ajax( {
                    url: url,
                    data: {},
                    dataType: 'json',
                    type: "get",
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader ("Authorization", "Basic " + btoa('anton@alterplay.com' + ":" + 'zaq123'));
                    },
                    success: function (data) {

                        _calculateFreeDaysForUser(data, userName);

                        setTimeout( function() {

                            _calendarContent.find('.calendar__content .calendar__row').eq( user = _users.find('.users__item[data-name="'+ userName +'"]').index()).removeClass('calendar__row_loading');

                            if( _select != undefined ) {

                                _select.removeClass('websters-select_loading');

                            }

                            if(_deleteLoadingFlag) {

                                _deleteLoading();

                            }

                        }, 300 );



                    },
                    error: function (XMLHttpRequest) {
                        if ( XMLHttpRequest.statusText != "abort" ) {
                            console.log("Error");
                        }
                    }
                } );

            },
            _initScroll = function() {

                _calendar.perfectScrollbar( {
                    useBothWheelAxes: true,
                    suppressScrollY: true
                } );

            },
            _insertUsers = function(data) {

                var users = data;

                _users.html('');

                $.each( users, function() {

                    var singleUser = this,
                        userItem = '<div class="users__item" data-start-month="'+ _startMonth +'" data-start-year="'+ _startYear +'" data-name="'+ singleUser.name +'">';

                    userItem += '<div class="users__pic">\
                                        <img src="'+ singleUser.avatarUrls['48x48'] +'" width="50" height="50" alt="">\
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

            },
            _putNewMonth = function(userName, value) {

                _request = $.ajax( {
                    url: 'http://jira-dev.alty.software/rest/api/2/user/properties/monthStartWork?username='+ userName +'',
                    headers: {
                      "Content-Type": "application/json;charset=UTF-8"
                    },
                    dataType: 'html',
                    data: JSON.stringify(
                        {
                            "monthStartWork": parseInt(value) + 1
                        }
                    ),
                    type: "put",
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader ("Authorization", "Basic " + btoa('anton@alterplay.com' + ":" + 'zaq123'));
                    },
                    success: function (data) {

                        _getUserPropertyMonth(userName);

                    },
                    error: function (XMLHttpRequest) {
                        if ( XMLHttpRequest.statusText != "abort" ) {
                            console.log("Error");
                        }
                    }
                } );

            },
            _putNewYear = function(userName, value) {

                _request = $.ajax( {
                    url: 'http://jira-dev.alty.software/rest/api/2/user/properties/yearStartWork?username='+ userName +'',
                    data: JSON.stringify(
                        {
                            "yearStartWork": value
                        }
                    ),
                    headers: {
                        "Content-Type": "application/json;charset=UTF-8"
                    },
                    dataType: 'html',
                    type: "put",
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader ("Authorization", "Basic " + btoa('anton@alterplay.com' + ":" + 'zaq123'));
                    },
                    success: function (data) {

                        _getUserPropertyYear(userName);

                    },
                    error: function (XMLHttpRequest) {
                        if ( XMLHttpRequest.statusText != "abort" ) {
                            console.log("Error");
                        }
                    }
                } );

            },
            _updateCalendarForUser = function(userName) {

                var user = _users.find('.users__item[data-name="'+ userName +'"]'),
                    startDateMonth = user.attr('data-start-month'),
                    startDateYear = user.attr('data-start-year'),
                    month = parseInt(startDateMonth),
                    year = parseInt(startDateYear),
                    nowDateYear = new Date().getFullYear(),
                    nowDateMonth = new Date().getMonth(),
                    userCalendarRow = _calendarContent.find('.calendar__content .calendar__row').eq( user.index()),
                    calendarRow = '';

                userCalendarRow.addClass('calendar__row_loading');

                _addYearsToArr(year);

                for( var i = nowDateYear; i >= year; i-- ) {

                    calendarRow += '<div data-year="'+ i +'" class="calendar__month"><div>';

                    if( nowDateYear != year ) {

                        if( i == nowDateYear ) {

                            for( var j = 0; j <= 11; j++ ) {

                                if( (11 - j) > nowDateMonth ) {

                                    calendarRow += '<div class="non-available" data-month="'+ (11-j) +'"></div> ';

                                } else {

                                    calendarRow += '<div data-month="'+ (11-j) +'"></div> ';

                                }

                            }

                        } else if( i == year ) {

                            for( var j = 0; j <= (11 - month); j++ ) {

                                calendarRow += '<div data-month="'+ (11-j) +'"></div> ';

                            }

                        } else {

                            for( var j = 0; j <= 11; j++ ) {

                                calendarRow += '<div data-month="'+ (11-j) +'"></div> ';

                            }

                        }

                    } else {

                        for( var j = 0; j <= 11; j++ ) {

                            if( (11 - j) > nowDateMonth ) {

                                calendarRow += '<div class="non-available" data-month="'+ (11-j) +'"></div> ';

                            } else {

                                calendarRow += '<div data-month="'+ (11-j) +'"></div> ';

                            }

                        }

                    }

                    calendarRow += '</div></div>';

                }

                calendarRow += '</div>';

                userCalendarRow.html(calendarRow);

                _updateYearsHead();

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
            _init = function () {
                _initScroll();
                _addEvents();
                _getAllUsers();
            };

        //public properties

        //public methods

        _init();
    };

} )();
