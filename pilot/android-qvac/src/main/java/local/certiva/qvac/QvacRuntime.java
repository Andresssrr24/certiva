package local.certiva.qvac;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import org.json.JSONObject;
import to.holepunch.bare.kit.Worklet;
import java.io.File;
import java.nio.charset.StandardCharsets;

/** Single native on-device model, shared by manual checks and the notification listener. */
public final class QvacRuntime {
    public interface Callback { void complete(JSONObject value, String error); }
    private static QvacRuntime instance;
    private final Context context;
    private final Handler main = new Handler(Looper.getMainLooper());
    private Worklet worklet;
    private boolean loaded, busy, started;
    private long generation;
    private boolean failed;
    private static final class Job {final String text;final Callback callback;Job(String t,Callback c){text=t;callback=c;}}
    private final java.util.ArrayDeque<Job> pending=new java.util.ArrayDeque<>();
    private final Runnable idle = () -> unload();
    private QvacRuntime(Context context){ this.context=context.getApplicationContext(); }
    public static synchronized QvacRuntime get(Context context){if(instance==null)instance=new QvacRuntime(context);return instance;}
    public static File modelFile(Context context){return new File(context.getFilesDir(),"qvac/Qwen3-1.7B-Q4_K_M.gguf");}
    public static boolean available(Context context){try {return modelFile(context).length()==ModelInstall.BYTES && ModelInstall.SHA256.equals(new String(java.nio.file.Files.readAllBytes(new File(modelFile(context).getParentFile(),"verified.sha256").toPath()),StandardCharsets.UTF_8).trim());} catch(Exception e){return false;}}
    public boolean isBusy(){return busy;}
    public void assess(String text, Callback callback){
        if(Looper.myLooper()!=Looper.getMainLooper()){main.post(()->assess(text,callback));return;}
        if(pending.size()>=6){callback.complete(null,"La cola de análisis local está llena");return;}
        pending.addLast(new Job(text,callback));drain();
    }
    private void drain(){
        if(busy||pending.isEmpty())return;
        Job job=pending.removeFirst();assessNow(job.text,(r,e)->{job.callback.complete(r,e);main.post(this::drain);});
    }
    private void assessNow(String text, Callback callback){
        if(Looper.myLooper()!=Looper.getMainLooper()){main.post(()->assess(text,callback));return;}
        if(failed){callback.complete(null,"Reinicia Certiva para volver a iniciar QVAC");return;}
        if(!available(context)){callback.complete(null,"Instala el modelo QVAC en este teléfono");return;}
        if(busy){callback.complete(null,"QVAC está analizando otro mensaje");return;}
        if(text==null || text.length()>2600){callback.complete(null,"El mensaje supera el contexto del modelo móvil");return;}
        busy=true;main.removeCallbacks(idle);
        ensureStarted(error->{
            if(error!=null){finish(null,error,callback);return;}
            if(loaded){infer(text,callback);return;}
            try{request(new JSONObject().put("op","load").put("modelPath",modelFile(context).getAbsolutePath()).put("nativeLibraryDir",context.getApplicationInfo().nativeLibraryDir),(r,e)->{
                if(e!=null){finish(null,e,callback);return;}
                loaded=true;infer(text,callback);
            });}catch(Exception e){finish(null,"No se pudo cargar el modelo",callback);}
        });
    }
    private interface Started {void done(String error);}
    private void ensureStarted(Started callback){
        if(started){callback.done(null);return;}
        try{
            worklet=new Worklet(new Worklet.Options().memoryLimit(128*1024*1024));
            byte[] bundle;
            try(var input=context.getAssets().open("certiva-qvac.bundle")){bundle=input.readAllBytes();}
            worklet.start("/certiva-qvac.bundle",java.nio.ByteBuffer.wrap(bundle),null);
            probe(0,callback);
        }catch(Throwable e){callback.done("No se pudo iniciar QVAC: "+e.getClass().getSimpleName());}
    }
    private void probe(int count, Started callback){
        if(count>30){callback.done("QVAC no pudo iniciar en Android");return;}
        try{request(new JSONObject().put("op","status"),(r,e)->{
            if(e!=null || r==null || !r.has("runtime")){main.postDelayed(()->probe(count+1,callback),100);return;}
            started=true;callback.done(null);
        });}catch(Exception e){callback.done("No se pudo comprobar QVAC");}
    }
    private void infer(String text, Callback callback){
        try{request(new JSONObject().put("op","assess").put("text",text),(r,e)->finish(r,e,callback));}
        catch(Exception e){finish(null,"No se pudo analizar el mensaje",callback);}
    }
    private void finish(JSONObject result,String error,Callback callback){busy=false;main.postDelayed(idle,60000);callback.complete(result,error);}
    private void request(JSONObject request,Callback callback){
        long current=++generation;
        final boolean[] settled={false};
        Runnable timeout=()->{if(!settled[0]&&generation==current){settled[0]=true;failed=true;callback.complete(null,"QVAC tardó demasiado; vuelve a abrir Certiva");}};
        main.postDelayed(timeout,120000);
        worklet.push(request.toString(),StandardCharsets.UTF_8,(reply,error)->{
            if(settled[0])return;
            settled[0]=true;main.removeCallbacks(timeout);
            if(error!=null){callback.complete(null,"Error del motor QVAC");return;}
            if(reply==null){callback.complete(null,"QVAC está iniciando");return;}
            try{JSONObject data=new JSONObject(reply);callback.complete(data,data.has("error")?data.getString("error"):null);}
            catch(Exception e){callback.complete(null,"Respuesta no válida de QVAC");}
        });
    }
    public void unload(){
        if(Looper.myLooper()!=Looper.getMainLooper()){main.post(this::unload);return;}
        if(busy||!loaded||worklet==null)return;
        busy=true;
        try{request(new JSONObject().put("op","unload"),(r,e)->{loaded=false;busy=false;drain();});}
        catch(Exception e){busy=false;}
    }
}
