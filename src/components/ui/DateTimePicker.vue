<template>
  <div id="date-time-picker" class="byt-row">
    <div id="time-picker" v-click-outside="() => { time.showSelect = false; }">
      <div class="date-time-picker-input byt-row">
        <div class="date-time-picker__icon cursor-pointer material-icons" @click="time.showSelect = !time.showSelect">
          schedule
        </div>
        <input class="time-picker__input"
          type="text"
          @click="time.showSelect = true"
          @input="textToDatetime"
          v-model.trim="time.prettyText" />
        <button class="date-time-picker-btns cursor-pointer" @click="increment(0, 0, -15)">
          <div class="material-icons">
            arrow_left
          </div>
        </button>
        <button class="date-time-picker-btns cursor-pointer" @click="increment(0, 0, 15)">
          <div class="material-icons">
            arrow_right
          </div>
        </button>
      </div>
      <div class="time-picker__options" v-if="time.showSelect">
        <simplebar style="height: 100%; overflow: auto;">
          <div class="time-picker__option cursor-pointer"
            @click="setTime(n.hour, n.minute)"
            align="left"
            v-for="n in time.options"
            :key="`${n.hour}-${n.minute}`">
            {{ n.hour }}:{{ n.minute === 0 ? '00' : n.minute }}
          </div>
        </simplebar>
      </div>
    </div>
    <div style="padding: 0 8px" />
    <div id="date-picker" v-click-outside="() => { calendar.show = false; }">
      <div class="date-time-picker-input byt-row">
        <div class="date-time-picker__icon cursor-pointer material-icons"
          @click="calendar.show = !calendar.show">
          today
        </div>
        <input class="date-picker__input"
          readonly
          type="text"
          @click="calendar.show = !calendar.show"
          v-model.trim="calendar.prettyText" />
        <button class="date-time-picker-btns cursor-pointer" @click="increment(0, -1, 0)">
          <div class="material-icons">
            arrow_left
          </div>
        </button>
        <button class="date-time-picker-btns cursor-pointer" @click="increment(0, 1, 0)">
          <div class="material-icons">
            arrow_right
          </div>
        </button>
      </div>
      <div class="date-picker__calendar" v-if="calendar.show && calendar.dates.length > 0">
        <table role="presentation" cellspacing="0" cellpadding="0">
          <thead>
            <tr class="date-picker-header" role="row">
              <td colspan="2">
                <button class="calendar-nextprev-btn cursor-pointer" @click="increment(-1, 0, 0)">«</button>
              </td>
              <td class="calendar-header" colspan="5">{{ calendar.header }}</td>
              <td>
                <button class="calendar-nextprev-btn cursor-pointer" @click="increment(1, 0, 0)">»</button>
              </td>
            </tr>
          </thead>
          <tbody role="grid">
            <tr>
              <th />
              <th class="calendar-day" role="columnheader" v-for="day in calendar.daysOfTheWeek" :key="day">{{ day }}</th>
            </tr>
            <tr v-for="i in 6" :key="i">
              <th role="header" />
              <td
                v-for="j in 7"
                :key="j"
                role="gridcell"
                @click="calendar.selected = calendar.dates[((i - 1) * 7) + (j - 1)]"
                class="calendar-date cursor-pointer"
                :class="{
                  'calendar-other-month': calendar.dates[((i - 1) * 7) + (j - 1)].otherMonth,
                  'calendar-today': calendar.dates[((i - 1) * 7) + (j - 1)].today,
                  'calendar-selected': (calendar.dates[((i - 1) * 7) + (j - 1)].year === calendar.selected.year && calendar.dates[((i - 1) * 7) + (j - 1)].month === calendar.selected.month && calendar.dates[((i - 1) * 7) + (j - 1)].date === calendar.selected.date)
                }">
                {{ calendar.dates[((i - 1) * 7) + (j - 1)].date }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import 'simplebar/dist/simplebar.min.css';

import moment from 'moment';
import 'moment-timezone';

import simplebar from 'simplebar-vue';
import ClickOutside from 'vue-click-outside';

export default {
  name: 'DateTimePicker',
  components: {
    simplebar,
  },
  directives: {
    ClickOutside,
  },
  data() {
    return {
      time: {
        prettyText: null,
        showSelect: false,
        options: [],
      },
      calendar: {
        datetime: moment().tz('Asia/Tokyo'),
        daysOfTheWeek: ['日', '月', '火', '水', '木', '金', '土'],
        prettyText: null,
        show: false,
        header: null,
        dates: [],
        selected: {
          year: null,
          month: null,
          date: null,
          otherMonth: false,
          today: false,
        },
      },
      datetime: moment().tz('Asia/Tokyo'),
    };
  },
  mounted() {
    // set today as selected
    const dt = this.datetime;
    this.calendar.selected = {
      year: dt.year(),
      month: dt.month() + 1,
      date: dt.date(),
      otherMonth: false,
      today: true,
    };

    // form calendar
    this.formCalendar(this.datetime);

    // set time select options
    for (let i = 0; i < 48; i += 1) {
      this.time.options.push({ hour: Math.floor(i / 2), minute: (i % 2) === 0 ? 0 : 30 });
    }
  },
  watch: {
    'calendar.selected': function f(value) {
      // clone calendar dt to dt
      this.datetime = this.calendar.datetime.clone();

      this.datetime.set('year', value.year);
      this.datetime.set('month', value.month - 1);
      this.datetime.set('date', value.date);
      this.setPrettyText();

      if (value.otherMonth) { this.formCalendar(this.datetime); }
    },
  },
  computed: {
    today() {
      return moment().tz('Asia/Tokyo');
    },
  },
  methods: {
    textToDatetime() {
      const text = this.time.prettyText;
      if (text === null || text.length === 0 || text.indexOf(':') < 1) {
        return;
      }

      const hour = text.split(':')[0];
      const minute = text.split(':')[1];

      if (hour.length === 0 || minute.length < 2) {
        return;
      }

      this.setTime(parseInt(hour, 10), parseInt(minute, 10));
    },
    setPrettyText() {
      // clear current time value
      this.$emit('set', null);

      const dateTime = this.datetime;

      // shown on input element tied to timepicker/select
      this.time.prettyText = dateTime.tz('Asia/Tokyo').format('H:mm');

      // shown on input element tied to datepicker
      const day = this.calendar.daysOfTheWeek[dateTime.weekday()];
      this.calendar.prettyText = `${dateTime.tz('Asia/Tokyo').format('M月D日')}(${day})`;

      // pass value to parent
      this.$emit('set', this.datetime);
    },
    setTime(hour, minute) {
      this.datetime.set('hour', hour);
      this.datetime.set('minute', minute);
      this.setPrettyText();
      this.time.showSelect = false;
    },
    increment(month, day, minute) {
      const oldDateTime = moment(this.datetime);

      if (month !== 0) {
        // modify calendar.datetime instead
        this.calendar.datetime.add(month, 'M');
        this.formCalendar(this.calendar.datetime);
        return;
      }

      this.datetime.add(month, 'M');
      this.datetime.add(day, 'd');
      this.datetime.add(minute, 'm');

      this.calendar.datetime = this.datetime.clone();
      this.calendar.selected = {
        year: this.datetime.year(),
        month: this.datetime.month() + 1,
        date: this.datetime.date(),
        otherMonth: this.datetime.month() !== oldDateTime.month(),
        today: this.datetime.year() === this.today.year() && this.datetime.month() === this.today.month() && this.datetime.date() === this.today.date(),
      };
    },
    formCalendar(start) {
      // text shown on calendar's header
      this.calendar.header = start.tz('Asia/Tokyo').format('YYYY年M月');

      let calendarDates = [];
      const calendarDate = moment(start);

      // how many of last month's days we need to show on the calendar
      let days2Add = calendarDate.day();

      // start from last month's last day
      calendarDate.date(1);
      calendarDate.subtract(1, 'd');

      for (let i = 0; i < days2Add; i += 1) {
        calendarDates.push({
          year: calendarDate.year(),
          month: calendarDate.month() + 1,
          date: calendarDate.date(),
          today: false,
          otherMonth: calendarDate.month() !== start.month(),
        });
        calendarDate.subtract(1, 'd');
      }

      // reverse order of array so dates are in ascending order
      calendarDates = calendarDates.reverse();

      // how many days in the future we need to show on the calendar
      days2Add = 42 - days2Add;

      // set calendarDate to next month + first day
      calendarDate.date(1);

      // delete?
      // calendarDate.month(calendarDate.month() + 1) + 1;

      for (let i = 0; i < days2Add; i += 1) {
        calendarDates.push({
          year: calendarDate.year(),
          month: calendarDate.month() + 1,
          date: calendarDate.date(),
          otherMonth: calendarDate.month() !== start.month(),
          today: calendarDate.year() === this.today.year() && calendarDate.month() === this.today.month() && calendarDate.date() === this.today.date(),
        });
        calendarDate.add(1, 'd');
      }

      this.calendar.dates = calendarDates;
    },
  },
};
</script>
