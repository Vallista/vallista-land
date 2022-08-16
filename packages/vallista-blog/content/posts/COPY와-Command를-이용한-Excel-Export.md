---
title: COPY와 Command를 이용한 Excel Export
tags:

date: 2019-01-29 18:00:08
draft: false
info: false
---

회사에서 `PostgreSQL`에서 Excel 포맷으로 출력 해야하는 일이 생겼습니다. 오프라인에서 물건을 점검하기위해 주문 상황을 체크하고 물건을 걸러내야 했는데 이는 종이로 하는 것이 효율적이기에 출력해야 되는 상황이었습니다.

그래서 PostgreSQL에서 파일 입출력이 가능한가에 대해서 찾아보았습니다. PostgreSQL에서는 쉽게 Excel로 뽑아내는 커맨드를 제공합니다. 바로 `COPY` 라는 커맨드인데요. 이 커맨드를 이용해서 한번 파일 출력을 해보겠습니다.

## 사용방법

```sql
COPY table_name [ ( column_name [, ...] ) ]
    FROM { 'filename' | STDIN }
    [ [ WITH ] ( option [, ...] ) ]

COPY { table_name [ ( column_name [, ...] ) ] | ( query ) }
    TO { 'filename' | STDOUT }
    [ [ WITH ] ( option [, ...] ) ]
```

```
where option can be one of:

    FORMAT format_name
    OIDS [ boolean ]
    DELIMITER 'delimiter_character'
    NULL 'null_string'
    HEADER [ boolean ]
    QUOTE 'quote_character'
    ESCAPE 'escape_character'
    FORCE_QUOTE { ( column_name [, ...] ) | * }
    FORCE_NOT_NULL ( column_name [, ...] )
    ENCODING 'encoding_name'
```

> 파일 타입은 csv 뿐만 아니라 다른 텍스트 포멧으로 나타낼 수 있습니다.

COPY를 사용하는 방법은 FROM과 TO로 나눌 수 있습니다.

## 실제 사용

사용 방법을 보니 사용되는 문법이 두 가지 있습니다.

### COPY ~ TO ~

```sql
postgresql> COPY order_item to '~/app/test.csv'
```

```
0 Apple 2019/01/17 1000
1 Juice 2019/01/13 2000
2 Candy 2019/01/11 3000
3 Grape 2019/01/10 4000
```

COPY ~ TO ~ 는 테이블에 있는 내용을 파일화 시키는 커맨드 입니다. 그래서 order_item 테이블을 `~/app/test.csv` 이름으로 액셀 파일로 만들어서 넣었습니다.

### COPY ~ FROM ~

```
~/app/test.csv

Apple 2019/01/17 1000
Juice 2019/01/13 2000
Candy 2019/01/11 3000
Grape 2019/01/10 4000
```

```sql
postgresql> COPY order_item from '~/app/test.csv'
```

```
| id | name  | created_at | payment
---------------------------------
| 0  | Apple | 2019/01/17 | 1000
| 1  | Juice | 2019/01/13 | 2000
| 2  | Candy | 2019/01/11 | 3000
| 3  | Grape | 2019/01/10 | 4000
---------------------------------
```

COPY ~ FROM ~ 는 테이블에 내용을 import 하는 기능입니다.
order_item 테이블에 `~/app/test.csv` 파일을 import 했습니다.

### 컬럼 필터링 및 순서 변경

```sql
postgresql> COPY order_item(created_at, id, name, payment) to '~/app/importFile.csv'
```

```
2019/01/17 0 Apple 1000
2019/01/13 1 Juice 2000
2019/01/11 2 Candy 3000
2019/01/10 3 Grape 4000
```

컬럼명을 명시하므로써 순서 및 출력할 컬럼만 추가 할 수 있습니다.

### 복잡한 쿼리를 나타내기

현재 구문으로는 한 가지의 테이블에 대한 데이터만 나타 낼 수 있는 것 같습니다.  
그렇다면 JOIN이나 WHERE등의 커맨드가 붙어야 할 때는 어떻게 해야할까요?

`()` 괄호를 열어주시면 됩니다.

```sql
postgresql> COPY (
  SELECT
    order_item.created_at,
    order_item.id,
    order_item.name,
    order_item.payment,
    item.item_code,
  FROM order_item
  WHERE order_item.id > 1
  JOIN item ON order_item.id = item.order_id
) to '~/app/importFile.csv'
```

```
2019/01/13 1 Juice 2000 100_0000_01
2019/01/11 2 Candy 3000 100_0000_02
2019/01/10 3 Grape 4000 100_0000_03
```

### 권한 없는 문제 해결

COPY 커맨드를 사용할 때 권한이 없는 에러를 뱉는 경우가 있습니다.

```sql
postgresql> \COPY (
  SELECT
    order_item.created_at,
    order_item.id,
    order_item.name,
    order_item.payment,
    item.item_code,
  FROM order_item
  WHERE order_item.id > 1
  JOIN item ON order_item.id = item.order_id
) to '~/app/importFile.csv'
```

그럴때는 COPY 앞에 `\`를 붙여주면 됩니다.

### 컬럼 이름으로 헤더 설정

컬럼 이름이 전혀 연관이 없는 이상한 이름으로 나오는 경우가 있습니다. 설정을 안하면 대다수의 파일이 그렇게 출력되는데요. 아래의 구문을 추가해주면 제대로 나옵니다.

```sql
// With CSV HEADER 추가

postgresql> \COPY (
  SELECT
    order_item.created_at,
    order_item.id,
    order_item.name,
    order_item.payment,
    item.item_code,
  FROM order_item
  WHERE order_item.id > 1
  JOIN item ON order_item.id = item.order_id
) to '~/app/importFile.csv' With CSV HEADER
```

열어서 파일을 확인해 보세요.

### 데이터의 구분문자로 구분하기

데이터를 넣을 때 구분문자가 있어야 데이터를 구분할 것 입니다.

```
~/app/test.csv

0, Apple, 2019/01/17, 1000
1, Juice, 2019/01/13, 2000
2, Candy, 2019/01/11, 3000
3, Grape, 2019/01/10, 4000

postgresql> \COPY order_item(created_at, id, name, payment) FROM '~/app/importFile.csv' With DELIMITER ',';

id | name  | created_at | payment
---------------------------------
0  | Apple | 2019/01/17 | 1000
1  | Juice | 2019/01/13 | 2000
2  | Candy | 2019/01/11 | 3000
3  | Grape | 2019/01/10 | 4000
---------------------------------
```
