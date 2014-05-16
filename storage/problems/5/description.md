# 문제
**서로 다른 정수로 구성되는 Max Heap을 처리하는 프로그램.**
stdin에서 cammand를 입력받으며, 각 command 수행 후 적절한 답을 stdout에 출력

**Command 종류 : **
```
I x : Max Heap에 x를 삽입[push]
D : 삭제[pop]
T : 가장 큰 값 출력[top]
P : Max Heap 내용 출력(root부터 노드 순서 차례로)
```

## 예제 입력
```
P
I 3
I 81
I 52
T
D
P
```
## 예제 출력
```
error
done
done
done
81
done
52 3
```
