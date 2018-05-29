# distributed-kvstore

Step 1: Clone the repository

Step 2: run npm install

Step 3: run start (it will create 2 processes)

Step 5: Now add a key value through 8080 process.
        ex,

        curl -X POST \
        http://localhost:8080/s/key \
        -H 'cache-control: no-cache' \
        -H 'content-type: application/json' \
        -H 'postman-token: 62fad9fb-42cc-e048-c0dd-9fa33f12cbd3' \
        -d '{
          "key": "key3",
          "value": "value1"
         }'

Step 6: Now read the key through 8081 process.
        ex,

        curl -X GET \
        'http://localhost:8081/s/key?key=key3' \
        -H 'cache-control: no-cache' \
        -H 'postman-token: aed78304-7dac-07ae-5848-22859519aacd'

Step 7: We can do the vise versa also.
