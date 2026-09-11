package local.certiva.qvac;

import android.content.Context;
import java.io.*;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.util.concurrent.Executors;
import android.os.Handler;
import android.os.Looper;

/** First-run HTTPS download; inference never makes network requests. */
public final class ModelInstall {
    public static final String SHA256="b139949c5bd74937ad8ed8c8cf3d9ffb1e99c866c823204dc42c0d91fa181897";
    public static final long BYTES=1107409472L;
    private static final String URL_STRING="https://huggingface.co/unsloth/Qwen3-1.7B-GGUF/resolve/main/Qwen3-1.7B-Q4_K_M.gguf";
    public interface Progress {void update(int percent,String error,boolean done);}
    private static boolean active;
    private static volatile int percent;
    public static synchronized boolean active(){return active;}
    public static int percent(){return percent;}
    public static synchronized void download(Context context,Progress callback){
        if(active)return;
        active=true;percent=0;
        Context app=context.getApplicationContext();Handler main=new Handler(Looper.getMainLooper());
        var executor=Executors.newSingleThreadExecutor();
        executor.execute(()->{
            String error=null;File target=QvacRuntime.modelFile(app), temp=new File(target.getParentFile(),"model.partial");
            javax.net.ssl.HttpsURLConnection connection=null;
            try{
                if(!target.getParentFile().isDirectory()&&!target.getParentFile().mkdirs())throw new IOException("No se pudo preparar el almacenamiento");
                if(target.getParentFile().getUsableSpace()<BYTES+200000000L)throw new IOException("Necesitas al menos 1,3 GB libres");
                connection=(javax.net.ssl.HttpsURLConnection)new URL(URL_STRING).openConnection();
                connection.setConnectTimeout(30000);connection.setReadTimeout(60000);
                if(connection.getResponseCode()!=200)throw new IOException("No se pudo descargar el modelo");
                MessageDigest digest=MessageDigest.getInstance("SHA-256");long total=0;
                try(InputStream in=connection.getInputStream();FileOutputStream out=new FileOutputStream(temp)){
                    byte[] buffer=new byte[1024*256];int read;
                    while((read=in.read(buffer))!=-1){total+=read;if(total>BYTES)throw new IOException("Tamaño de modelo incorrecto");out.write(buffer,0,read);digest.update(buffer,0,read);
                        int progress=(int)(total*100/BYTES);if(progress!=percent){percent=progress;main.post(()->callback.update(progress,null,false));}}
                    out.getFD().sync();
                }
                StringBuilder hash=new StringBuilder();for(byte b:digest.digest())hash.append(String.format(java.util.Locale.ROOT,"%02x",b&255));
                if(total!=BYTES||!SHA256.contentEquals(hash))throw new IOException("La verificación del modelo falló");
                Files.move(temp.toPath(),target.toPath(),StandardCopyOption.REPLACE_EXISTING,StandardCopyOption.ATOMIC_MOVE);
                Files.write(new File(target.getParentFile(),"verified.sha256").toPath(),SHA256.getBytes(StandardCharsets.UTF_8));
            }catch(Exception e){error=e.getMessage()==null?"No se pudo instalar el modelo":e.getMessage();temp.delete();}
            finally{if(connection!=null)connection.disconnect();synchronized(ModelInstall.class){active=false;}executor.shutdown();}
            String message=error;main.post(()->callback.update(percent,message,true));
        });
    }
}
