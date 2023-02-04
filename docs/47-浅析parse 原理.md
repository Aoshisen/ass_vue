# 浅析parse原理 

在之前我们去实现baseParse 函数的时候我们其实是用了一定的技术的，这个技术叫做"有限状态机",我们用这个方法来逐个处理我们的字符串，然后解析成我们的ast 抽象语法树

## 有限状态机

概念: 简单的理解就是 现在有一个状态如果你给两个不同的条件，现在这个状态就会演变成两个不同的其他或者当前的状态(读取一组数据，然后根据这些数据来改变成不同的状态)

反观我们的parse 逻辑也可抽象成一个状态机

我们需要解析的字符串 "<div>hi,{{message}}</div>"

context ==>如果以"<"开头并且context 的第二个字符为a-z 就走解析parseElement 的逻辑，然后我们去处理element element 类型的 会去调用解析tag的逻辑，然后处理过后返回一个表示element 的对象，这个element上面如果还有children的话还可以调用parseChildren 来解析element 上的children  *element.children=parseChildren(context,ancestors)*

处理完element 之后状态变回初始状态，然后再去判断现在结束没有，现在很明显是没有结束的，所以下面就会默认的去解析，hi,这个文本节点，处理完文本节点，

遇到 {{ 标识符，表示当前的循环该停止,状态变成初始状态，然后我们又因为{{是解析插值的标志，所以状态就会顺着这个条件跳转到解析插值的函数里面去，然后插值解析完, 遇到结束的tag 标签推进我们的context，然后再次回到初始状态


## 利用有限状态机来实现正则匹配相关

```javascript
// /abc/.text('abc')

function test(string){
    function waitForA(char){
         if(char==="a"){
            return waitForB;
         }
         return waitForA
    }
    function waitForB(char){
        if(char==="b"){
            return waitForC;
        }
        return waitForA;
    }
    function waitForC(char){
        if(char==="c"){
            return end;
        }
        return waitForA
    }

    function end(){
        return end;
    }

    for(let i=0;i<string.length;i++){
       let nextState= currentState(string[i])
       currentState=nextState;

       if(currentState===end){
        return true;
       }

    }

    return false

}
test("aabcaa")
```

改写以获取匹配字符的index 


```javascript
// /abc/.text('abc')

function test(string){
    let i;
    let startIndex;
    let endIndex;
    function waitForA(char){
         if(char==="a"){
            startIndex=i
            return waitForB;
         }
         return waitForA
    }
    function waitForB(char){
        if(char==="b"){
            return waitForC;
        }
        return waitForA;
    }
    function waitForC(char){
        if(char==="c"){
            endIndex=i
            return end;
        }
        return waitForA
    }

    function end(){
        return end;
    }

    for(i=0;i<string.length;i++){
       let nextState= currentState(string[i])
       currentState=nextState;

       if(currentState===end){
        console.log(startIndex,)

        //重置状态为开始状态
        currentState=waitForA;
       }

    }


}
test("aabcaa")
```

想扩展可以匹配多个，然后返回多个的下标

```javascript
// /abc/.text('abc')

function test(string){
    let i;
    let startIndex;
    let endIndex;
    let result=[]
    function waitForA(char){
         if(char==="a"){
            startIndex=i
            return waitForB;
         }
         return waitForA
    }
    function waitForB(char){
        if(char==="b"){
            return waitForC;
        }
        return waitForA;
    }
    function waitForC(char){
        if(char==="c"){
            endIndex=i
            return end;
        }
        return waitForA
    }

    function end(){
        return end;
    }

    for(i=0;i<string.length;i++){
       let nextState= currentState(string[i])
       currentState=nextState;

       if(currentState===end){
        console.log(startIndex,endIndex)

        result.push({startIndex,endIndex})
        //重置状态为开始状态
        currentState=waitForA;
       }

    }


}
test("aabcaa")
```

