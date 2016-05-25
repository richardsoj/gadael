'use strict';

const gt = require('./../../modules/gettext');

module.exports = exports = {
    rights: [
        {
            name: gt.gettext("Paid annual leave"),
            quantity: 25,
            rules: [
                {
                    type: "entry_date",
                    title: gt.gettext("The creation of the request can be made in the period of renewal, with 30 days of tolerance"),
                    min: 30,
                    max: 30
                },
                {
                    type: "request_period",
                    title: gt.gettext("The absence must be within the renewal period"),
                    min: 0,
                    max: 0
                }
            ],
            renewal: {
                start: {
                    month:5,
                    day:1
                }
            }
        },
        {
            name: "RTT",
            quantity: 9,
            rules: [
                {
                    type: "entry_date",
                    title: gt.gettext("The creation of the request can be made in the period of renewal, with 30 days of tolerance"),
                    min: 30,
                    max: 30
                },
                {
                    type: "request_period",
                    title: gt.gettext("The absence must be within the renewal period"),
                    min: 0,
                    max: 0
                }
            ],
            renewal: {
                start: {
                    month:5,
                    day:1
                }
            }
        },
        {
            name: gt.gettext("Maternity"),
            quantity: 80,
            activeFor: {  account: false }
        }
    ]
};
