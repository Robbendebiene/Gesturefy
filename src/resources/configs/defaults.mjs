export default Object.freeze({
  "Settings": {
    "Gesture": {
      "mouseButton": 2,
      "suppressionKey": "",
      "distanceThreshold": 10,
      "deviationTolerance": 0.15,
      "matchingAlgorithm": "combined",
      "Timeout": {
        "active": false,
        "duration": 1
      },
      "Trace": {
        "display": true,
        "Style": {
          "strokeStyle": "#00aaa0cc",
          "lineWidth": 10,
          "lineGrowth": true
        }
      },
      "Command": {
        "display": true,
        "Style": {
          "fontColor": "#ffffffff",
          "backgroundColor": "#00000080",
          "fontSize": "7vh",
          "horizontalPosition": 50,
          "verticalPosition": 40
        }
      }
    },
    "Rocker": {
      "active": false,
      "leftMouseClick": [
        {
          "name": "PageBack"
        }
      ],
      "rightMouseClick": [
        {
          "name": "PageForth"
        }
      ]
    },
    "Wheel": {
      "active": false,
      "mouseButton": 1,
      "wheelSensitivity": 30,
      "wheelUp": [
        {
          "name": "FocusRightTab",
          "settings": {
            "cycling": true,
            "excludeDiscarded": false
          }
        }
      ],
      "wheelDown": [
        {
          "name": "FocusLeftTab",
          "settings": {
            "cycling": true,
            "excludeDiscarded": false
          }
        }
      ]
    },
    "General": {
      "updateNotification": true,
      "theme": "light"
    }
  },
  "Gestures": [
    {
      "pattern": [
        [
          -37,
          -25
        ],
        [
          -88,
          -11
        ],
        [
          -50,
          17
        ],
        [
          -63,
          62
        ],
        [
          -22,
          68
        ],
        [
          4,
          50
        ],
        [
          33,
          49
        ],
        [
          84,
          43
        ],
        [
          105,
          -4
        ],
        [
          46,
          -24
        ],
        [
          22,
          -27
        ],
        [
          8,
          -23
        ],
        [
          -4,
          -44
        ],
        [
          -16,
          -17
        ],
        [
          -56,
          -17
        ],
        [
          -77,
          8
        ]
      ],
      "commands": [
        {
          "name": "OpenAddonSettings"
        }
      ]
    },
    {
      "pattern": [
        [
          -1,
          -1
        ]
      ],
      "commands": [
        {
          "name": "FocusLeftTab",
          "settings": {
            "cycling": true,
            "excludeDiscarded": false
          }
        }
      ]
    },
    {
      "pattern": [
        [
          1,
          -1
        ]
      ],
      "commands": [
        {
          "name": "FocusRightTab",
          "settings": {
            "cycling": true,
            "excludeDiscarded": false
          }
        }
      ]
    },
    {
      "pattern": [
        [
          0,
          1
        ]
      ],
      "commands": [
        {
          "name": "ScrollBottom",
          "settings": {
            "duration": 100
          }
        }
      ]
    },
    {
      "pattern": [
        [
          0,
          -1
        ]
      ],
      "commands": [
        {
          "name": "ScrollTop",
          "settings": {
            "duration": 100
          }
        }
      ]
    },
    {
      "pattern": [
        [
          1,
          0
        ]
      ],
      "commands": [
        {
          "name": "PageForth"
        }
      ]
    },
    {
      "pattern": [
        [
          -1,
          0
        ]
      ],
      "commands": [
        {
          "name": "PageBack"
        }
      ]
    },
    {
      "pattern": [
        [
          -145,
          -16
        ],
        [
          -82,
          21
        ],
        [
          -77,
          67
        ],
        [
          -31,
          60
        ],
        [
          -2,
          96
        ],
        [
          25,
          55
        ],
        [
          53,
          42
        ],
        [
          192,
          7
        ],
        [
          75,
          -14
        ]
      ],
      "commands": [
        {
          "name": "ReloadTab",
          "settings": {
            "cache": true
          }
        }
      ]
    },
    {
      "pattern": [
        [
          300,
          -10
        ],
        [
          -300,
          -20
        ]
      ],
      "commands": [
        {
          "name": "CloseTab",
          "settings": {
            "nextFocus": "default",
            "closePinned": true
          }
        }
      ]
    },
    {
      "pattern": [
        [
          21,
          300
        ],
        [
          17,
          -300
        ]
      ],
      "commands": [
        {
          "name": "NewTab",
          "settings": {
            "position": "default",
            "focus": true
          }
        }
      ]
    }
  ],
  "Exclusions": []
});
