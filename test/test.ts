export const list = [
  {
    "id": "100",
    "name": ["A", "张三"],
    "pid": 0,
    "children": [
      {
        "id": "101",
        "name": "B",
        "pid": "100",
        "children": [
          {
            "id": "102",
            "name": "C",
            "pid": "101",
            "children": [
              {
                "id": "103",
                "name": "D",
                "pid": "102",
                "children": [
                  {
                    "id": "104",
                    "name": "E",
                    "pid": "103",
                    "children": []
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
]