`timescale 1ns / 1ps

module pipeline_cpu_complete_tb;


//==========================================================
// Clock and Reset
//==========================================================

logic clk;
logic reset;


//==========================================================
// DUT
//==========================================================

pipeline_cpu_complete DUT(

    .clk(clk),
    .reset(reset)

);


//==========================================================
// Clock Generation
//==========================================================

initial begin

    clk = 0;

    forever #5 clk = ~clk;

end


//==========================================================
// Test Sequence
//==========================================================

initial begin

    $dumpfile("pipeline_complete.vcd");
    $dumpvars(0,pipeline_cpu_complete_tb);


    $display("-----------------------------------------");
    $display(" QuantumRISC Complete CPU Test ");
    $display("-----------------------------------------");


    reset = 1;

    #20;

    reset = 0;


    // Run CPU
    #200;


    $display("-----------------------------------------");
    $display(" CPU Execution Completed ");
    $display("-----------------------------------------");


    $finish;

end


endmodule