/**
 * Created by pekko1215 on 2018/11/23.
 */


<targetHand>
    <miniCard each={ field.target.hand }>
    </miniCard>
    <script>
        this.on('updated',()=>{
            var arr = this.tags.minicard||[];
            if(!Array.isArray(arr))arr = [arr];
            arr.forEach((e,i)=>{
                e.opts.card = field.target.hand[i];
                e.mount();
            })
        })
    </script>
    <style scoped>
        :scope{
            display:flex;
        }
    </style>
</targetHand>

<cardView>

</cardView>
<hand>
    <miniCard each={ field.my.hand }>
    </miniCard>
    <script>
        this.on('updated',()=>{
            var arr = this.tags.minicard||[];
            if(!Array.isArray(arr))arr = [arr];
            arr.forEach((e,i)=>{
                e.opts.card = field.my.hand[i];
                e.mount();
            })
        })
    </script>
    <style scoped>
        :scope{
            display:flex;
        }
    </style>
</hand>
<charger>
    <miniCard each={ field.my.charger }>
    </miniCard>
    <script>
        this.on('updated',()=>{
            var arr = this.tags.minicard||[];
            if(!Array.isArray(arr))arr = [arr];
            arr.forEach((e,i)=>{
                e.opts.card = field.my.charger[i];
                e.mount();
            })
        })
    </script>
    <style scoped>
        :scope{
            display:flex;
        }
        miniCard{
            transform:rotate(90deg);
            margin-left:-30px;
        }
    </style>
</charger>

<miniCard>
    <p>{JSON.stringify(opts)}</p>

    <script>

    </script>
    <style scoped>

    </style>
</miniCard>