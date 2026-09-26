# Scroll motion

محرك الحركات العام خفيف ولا يعتمد على مكتبة خارجية.

- `data-reveal="inline-start"` للنصوص من بداية السطر (اليمين في RTL).
- `data-reveal="inline-end"` من الجهة المقابلة.
- `data-reveal="up"` للصور والبطاقات.
- `data-reveal="scale"` لتكبير خفيف.
- `data-stagger` على الحاوية لتأخير العناصر التابعة بالتتابع.
- `data-parallax="12"` لحركة تمرير بسيطة؛ القيمة هي أقصى إزاحة بالبكسل.
- `motion-card` و`motion-action` لتأثيرات hover المتناسقة.

كل الحركات تستخدم `opacity` و`transform` فقط، وتتعطل تلقائيًا عند `prefers-reduced-motion`.
