(defproject screenpop "0.1.0-SNAPSHOT"
  :description "FIXME: write description"
  :url "http://example.com/FIXME"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :dependencies [[org.clojure/clojure "1.5.1"]
                 [http-kit "2.1.9"]
                 [ring "1.2.0"]
                 [ring/ring-json "0.2.0"]
                 [compojure "1.1.5"]
                 [cheshire "5.2.0"]
                 [org.clojure/tools.logging "0.2.6"]
                 [ch.qos.logback/logback-classic "1.0.13"]]
  :ring {:handler screenpop.core/app
         :port 9999}
  :plugins [[lein-ring "0.8.5"]]
  :profiles {:production
   {:ring {:open-browser? false, :stacktraces? false, :auto-reload? false}},
   :dev
   {:ring {:open-browser? true, :stacktraces? true, :auto-reload? true}
    :dependencies [[ring-mock "0.1.5"] [ring/ring-devel "1.2.0"]]}})
