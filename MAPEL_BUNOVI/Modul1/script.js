        //Membuat canvas
        const canvas = document.getElementById("DestaCanvas")
        const ctx = canvas.getContext("2d");

        //Mulai membuat garis
        ctx.beginPath();

        //titik awal garis
        ctx.moveTo(10,10);

        ctx.lineTo(150, 150);
        ctx.stroke();