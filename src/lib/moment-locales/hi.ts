// @ts-nocheck - Moment locale definitions use patterns not well-typed
import moment from "moment";

const symbolMap: Record<string, string> = {
  "1": "१",
  "2": "२",
  "3": "३",
  "4": "४",
  "5": "५",
  "6": "६",
  "7": "७",
  "8": "८",
  "9": "९",
  "0": "०",
};
const numberMap: Record<string, string> = {
  "१": "1",
  "२": "2",
  "३": "3",
  "४": "4",
  "५": "5",
  "६": "6",
  "७": "7",
  "८": "8",
  "९": "9",
  "०": "0",
};
const monthsParse = [
  /^जन/i,
  /^फ़र|फर/i,
  /^मार्च/i,
  /^अप्रै/i,
  /^मई/i,
  /^जून/i,
  /^जुल/i,
  /^अग/i,
  /^सितं|सित/i,
  /^अक्टू/i,
  /^नव|नवं/i,
  /^दिसं|दिस/i,
];
const shortMonthsParse = [
  /^जन/i,
  /^फ़र/i,
  /^मार्च/i,
  /^अप्रै/i,
  /^मई/i,
  /^जून/i,
  /^जुल/i,
  /^अग/i,
  /^सित/i,
  /^अक्टू/i,
  /^नव/i,
  /^दिस/i,
];

moment.defineLocale("hi", {
  months: {
    format:
      "जनवरी_फ़रवरी_मार्च_अप्रैल_मई_जून_जुलाई_अगस्त_सितम्बर_अक्टूबर_नवम्बर_दिसम्बर".split(
        "_",
      ),
    standalone:
      "जनवरी_फरवरी_मार्च_अप्रैल_मई_जून_जुलाई_अगस्त_सितंबर_अक्टूबर_नवंबर_दिसंबर".split("_"),
  },
  monthsShort: "जन._फ़र._मार्च_अप्रै._मई_जून_जुल._अग._सित._अक्टू._नव._दिस.".split("_"),
  weekdays: "रविवार_सोमवार_मंगलवार_बुधवार_गुरूवार_शुक्रवार_शनिवार".split("_"),
  weekdaysShort: "रवि_सोम_मंगल_बुध_गुरू_शुक्र_शनि".split("_"),
  weekdaysMin: "र_सो_मं_बु_गु_शु_श".split("_"),
  longDateFormat: {
    LT: "A h:mm बजे",
    LTS: "A h:mm:ss बजे",
    L: "DD/MM/YYYY",
    LL: "D MMMM YYYY",
    LLL: "D MMMM YYYY, A h:mm बजे",
    LLLL: "dddd, D MMMM YYYY, A h:mm बजे",
  },
  monthsParse: monthsParse,
  longMonthsParse: monthsParse,
  shortMonthsParse: shortMonthsParse,
  monthsRegex:
    /^(जनवरी|जन\.?|फ़रवरी|फरवरी|फ़र\.?|मार्च?|अप्रैल|अप्रै\.?|मई?|जून?|जुलाई|जुल\.?|अगस्त|अग\.?|सितम्बर|सितंबर|सित\.?|अक्टूबर|अक्टू\.?|नवम्बर|नवंबर|नव\.?|दिसम्बर|दिसंबर|दिस\.?)/i,
  monthsShortRegex:
    /^(जनवरी|जन\.?|फ़रवरी|फरवरी|फ़र\.?|मार्च?|अप्रैल|अप्रै\.?|मई?|जून?|जुलाई|जुल\.?|अगस्त|अग\.?|सितम्बर|सितंबर|सित\.?|अक्टूबर|अक्टू\.?|नवम्बर|नवंबर|नव\.?|दिसम्बर|दिसंबर|दिस\.?)/i,
  monthsStrictRegex:
    /^(जनवरी?|फ़रवरी|फरवरी?|मार्च?|अप्रैल?|मई?|जून?|जुलाई?|अगस्त?|सितम्बर|सितंबर|सित?\.?|अक्टूबर|अक्टू\.?|नवम्बर|नवंबर?|दिसम्बर|दिसंबर?)/i,
  monthsShortStrictRegex:
    /^(जन\.?|फ़र\.?|मार्च?|अप्रै\.?|मई?|जून?|जुल\.?|अग\.?|सित\.?|अक्टू\.?|नव\.?|दिस\.?)/i,
  calendar: {
    sameDay: "[आज] LT",
    nextDay: "[कल] LT",
    nextWeek: "dddd, LT",
    lastDay: "[कल] LT",
    lastWeek: "[पिछले] dddd, LT",
    sameElse: "L",
  },
  relativeTime: {
    future: "%s में",
    past: "%s पहले",
    s: "कुछ ही क्षण",
    ss: "%d सेकंड",
    m: "एक मिनट",
    mm: "%d मिनट",
    h: "एक घंटा",
    hh: "%d घंटे",
    d: "एक दिन",
    dd: "%d दिन",
    M: "एक महीने",
    MM: "%d महीने",
    y: "एक वर्ष",
    yy: "%d वर्ष",
  },
  preparse: (string) =>
    string.replace(/[१२३४५६७८९०]/g, (match) => numberMap[match]),
  postformat: (string) => string.replace(/\d/g, (match) => symbolMap[match]),
  meridiemParse: /रात|सुबह|दोपहर|शाम/,
  meridiemHour: (hour, meridiem) => {
    if (hour === 12) {
      hour = 0;
    }
    if (meridiem === "रात") {
      return hour < 4 ? hour : hour + 12;
    }
    if (meridiem === "सुबह") {
      return hour;
    }
    if (meridiem === "दोपहर") {
      return hour >= 10 ? hour : hour + 12;
    }
    if (meridiem === "शाम") {
      return hour + 12;
    }
    return hour;
  },
  meridiem: (hour) => {
    if (hour < 4) {
      return "रात";
    }
    if (hour < 10) {
      return "सुबह";
    }
    if (hour < 17) {
      return "दोपहर";
    }
    if (hour < 20) {
      return "शाम";
    }
    return "रात";
  },
  week: {
    dow: 0,
    doy: 6,
  },
});

// Reset to English after defining (moment.defineLocale changes the global locale)
moment.locale("en");
